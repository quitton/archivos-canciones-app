// ... Mantén tu definición de estados y loadArchivos(), calcularEstadoCancion() como antes

// Calcula el estado de un archivo en función de sus canciones (el más bajo)
function calcularEstadoArchivo(archivo) {
  if (!archivo.canciones || archivo.canciones.length === 0) return null;
  // Orden de estados de menor a mayor
  const orden = ['germinando', 'brotando', 'enraizado', 'florecido'];
  let minIdx = orden.length - 1;
  archivo.canciones.forEach(c=>{
    const est = calcularEstadoCancion(c);
    const idx = orden.indexOf(est);
    if (idx !== -1 && idx < minIdx) minIdx = idx;
  });
  return orden[minIdx];
}

// Obtiene todas las categorías presentes en las canciones de un archivo
function categoriasDeArchivo(archivo) {
  let motivos = new Set(), emociones = new Set(), lugares = new Set();
  (archivo.canciones||[]).forEach(c=>{
    (c.motivos||[]).forEach(m=>motivos.add(m));
    (c.emociones||[]).forEach(e=>emociones.add(e));
    (c.lugares||[]).forEach(l=>lugares.add(l));
  });
  return {
    motivos: Array.from(motivos),
    emociones: Array.from(emociones),
    lugares: Array.from(lugares),
  };
}

// --- Render filtros y lista de archivos ---
function renderVistaArchivos(filtro = {}) {
  const archivos = loadArchivos();
  // Calcula categorías globales para mostrar los filtros
  let motivosSet = new Set(), emocionesSet = new Set(), lugaresSet = new Set();
  archivos.forEach(arch=>{
    const cats = categoriasDeArchivo(arch);
    cats.motivos.forEach(m=>motivosSet.add(m));
    cats.emociones.forEach(e=>emocionesSet.add(e));
    cats.lugares.forEach(l=>lugaresSet.add(l));
  });

  // Filtros de estado
  let filtrosEstado = `
    <div class="mb-2">
      <b>Filtrar por Estado de Archivo:</b>
      <span class="badge bg-light text-dark" style="cursor:pointer" onclick="filtrarArchivos('estado','')">Todos</span>
      ${estados.map(est=>`
        <span class="badge bg-${est.color}" style="cursor:pointer" onclick="filtrarArchivos('estado','${est.key}')">${est.label}</span>
      `).join(' ')}
    </div>
  `;
  // Filtros de categorías
  let filtrosCategorias = `<div class="mb-2"><b>Filtrar por Categoría de Archivo:</b><br>`;
  if (motivosSet.size) {
    filtrosCategorias += `<span class="me-2">Motivos:</span>`;
    motivosSet.forEach(m=>{
      filtrosCategorias += `<span class="badge bg-success me-1" style="cursor:pointer" onclick="filtrarArchivos('motivos','${m}')">${m}</span>`;
    });
    filtrosCategorias += `<br>`;
  }
  if (emocionesSet.size) {
    filtrosCategorias += `<span class="me-2">Emociones:</span>`;
    emocionesSet.forEach(e=>{
      filtrosCategorias += `<span class="badge bg-warning text-dark me-1" style="cursor:pointer" onclick="filtrarArchivos('emociones','${e}')">${e}</span>`;
    });
    filtrosCategorias += `<br>`;
  }
  if (lugaresSet.size) {
    filtrosCategorias += `<span class="me-2">Lugares:</span>`;
    lugaresSet.forEach(l=>{
      filtrosCategorias += `<span class="badge bg-primary me-1" style="cursor:pointer" onclick="filtrarArchivos('lugares','${l}')">${l}</span>`;
    });
    filtrosCategorias += `<br>`;
  }
  filtrosCategorias += `<span class="badge bg-light text-dark mt-2" style="cursor:pointer" onclick="filtrarArchivos('','')">Quitar filtros</span>`;
  filtrosCategorias += `</div>`;

  // Aplica el filtro a los archivos
  let archivosFiltrados = archivos;
  if (filtro && filtro.tipo && filtro.valor) {
    if (filtro.tipo === 'estado') {
      archivosFiltrados = archivosFiltrados.filter(a=>calcularEstadoArchivo(a) === filtro.valor);
    } else if (['motivos','emociones','lugares'].includes(filtro.tipo)) {
      archivosFiltrados = archivosFiltrados.filter(a=>categoriasDeArchivo(a)[filtro.tipo].includes(filtro.valor));
    }
  }

  let filtroActivoHTML = "";
  if (filtro && filtro.tipo && filtro.valor) {
    let label = filtro.tipo === 'estado'
      ? (estados.find(e=>e.key === filtro.valor)?.label || filtro.valor)
      : filtro.valor;
    filtroActivoHTML = `<div class="mb-2"><span class="badge bg-info">Filtro activo: ${label}</span> <button class="btn btn-sm btn-light" onclick="filtrarArchivos('','')">Quitar filtro</button></div>`;
  }

  let html = `
    <h4>Archivos</h4>
    ${filtrosEstado}
    ${filtrosCategorias}
    ${filtroActivoHTML}
    <div class="row g-2">
      ${archivosFiltrados.length === 0 ? `<div class="alert alert-info">No hay archivos para este filtro.</div>` : ""}
      ${archivosFiltrados.map(arch => {
        const estKey = calcularEstadoArchivo(arch);
        const est = estados.find(e=>e.key===estKey);
        const cats = categoriasDeArchivo(arch);
        return `
        <div class="col-12 col-md-6">
          <div class="card mb-2">
            <div class="card-body">
              <h5>${arch.titulo} ${est ? `<span class="badge bg-${est.color} ms-2">${est.label}</span>` : ""}</h5>
              <p class="text-muted">${arch.descripcion||""}</p>
              <span class="badge bg-info mb-2">${arch.canciones?.length||0} canciones</span>
              <div>
                ${cats.motivos.map(m=>`<span class="badge bg-success me-1">${m}</span>`).join('')}
                ${cats.emociones.map(e=>`<span class="badge bg-warning text-dark me-1">${e}</span>`).join('')}
                ${cats.lugares.map(l=>`<span class="badge bg-primary me-1">${l}</span>`).join('')}
              </div>
              <button class="btn btn-sm btn-primary me-2 mt-2" onclick="abrirArchivo('${arch.id}')">
                Ver Detalle
              </button>
              <button class="btn btn-sm btn-secondary mt-2" onclick="editarArchivo('${arch.id}')">
                Editar
              </button>
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;
  $("#vistaArchivos").html(html).show();
  $("#vistaArchivoDetalle").hide();
}

// Función de filtro global
window.filtrarArchivos = function(tipo, valor) {
  if (!tipo || !valor) {
    renderVistaArchivos({});
  } else {
    renderVistaArchivos({tipo, valor});
  }
}

// ... Mantén el resto de tu app.js igual, solo sustituye la función renderVistaArchivos y añade las funciones nuevas y el filtro global