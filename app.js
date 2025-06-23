// --- Modelo base ---
const LS_ARCHIVOS = "archivosColeccion";
function loadArchivos() {
  return JSON.parse(localStorage.getItem(LS_ARCHIVOS) || "[]");
}
function saveArchivos(arr) {
  localStorage.setItem(LS_ARCHIVOS, JSON.stringify(arr));
}

// --- Estado de la canción ---
const estados = [
  { key: 'germinando', label: 'Germinando', color: 'success' },
  { key: 'brotando', label: 'Brotando', color: 'primary' },
  { key: 'enraizado', label: 'Enraizado', color: 'warning' },
  { key: 'florecido', label: 'Florecido', color: 'danger' }
];
function calcularEstadoCancion(c) {
  if (!c.titulo) return null;
  if (c.letra && c.audio) {
    if (c.creditos) {
      if (
        (c.motivos && c.motivos.length) &&
        (c.emociones && c.emociones.length) &&
        (c.lugares && c.lugares.length)
      ) {
        return 'florecido';
      }
      return 'enraizado';
    }
    return 'brotando';
  }
  return 'germinando';
}

// ---- Vistas principales ----
function renderVistaArchivos() {
  const archivos = loadArchivos();
  let html = `
    <h4>Archivos</h4>
    <div class="row g-2">
      ${archivos.map(arch => `
        <div class="col-12 col-md-6">
          <div class="card mb-2">
            <div class="card-body">
              <h5>${arch.titulo}</h5>
              <p class="text-muted">${arch.descripcion||""}</p>
              <span class="badge bg-info mb-2">${arch.canciones?.length||0} canciones</span>
              <br>
              <button class="btn btn-sm btn-primary me-2" onclick="abrirArchivo('${arch.id}')">
                Ver Detalle
              </button>
              <button class="btn btn-sm btn-secondary" onclick="editarArchivo('${arch.id}')">
                Editar
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  $("#vistaArchivos").html(html).show();
  $("#vistaArchivoDetalle").hide();
}
window.abrirArchivo = function(id) {
  const archivo = loadArchivos().find(a=>a.id===id);
  if (!archivo) return;
  // Por defecto sin filtro
  renderVistaArchivoDetalle(archivo, {});
}
function renderVistaArchivoDetalle(archivo, filtro = {}) {
  // --- Filtros de estado ---
  let filtrosEstado = `
    <div class="mb-2">
      <b>Filtrar por Estado:</b>
      <span class="badge bg-light text-dark" style="cursor:pointer" onclick="filtrarCanciones('${archivo.id}', 'estado', '')">Todos</span>
      ${estados.map(est=>`
        <span class="badge bg-${est.color}" style="cursor:pointer" onclick="filtrarCanciones('${archivo.id}', 'estado', '${est.key}')">${est.label}</span>
      `).join(' ')}
    </div>
  `;
  // --- Filtros por categorías (solo las presentes en las canciones) ---
  const canciones = archivo.canciones || [];
  let motivosSet = new Set(), emocionesSet = new Set(), lugaresSet = new Set();
  canciones.forEach(c=>{
    (c.motivos||[]).forEach(m=>motivosSet.add(m));
    (c.emociones||[]).forEach(e=>emocionesSet.add(e));
    (c.lugares||[]).forEach(l=>lugaresSet.add(l));
  });
  let filtrosCategorias = `<div class="mb-2"><b>Filtrar por Categoría:</b><br>`;
  // Motivos
  if (motivosSet.size) {
    filtrosCategorias += `<span class="me-2">Motivos:</span>`;
    motivosSet.forEach(m=>{
      filtrosCategorias += `<span class="badge bg-success me-1" style="cursor:pointer" onclick="filtrarCanciones('${archivo.id}', 'motivos', '${m}')">${m}</span>`;
    });
    filtrosCategorias += `<br>`;
  }
  // Emociones
  if (emocionesSet.size) {
    filtrosCategorias += `<span class="me-2">Emociones:</span>`;
    emocionesSet.forEach(e=>{
      filtrosCategorias += `<span class="badge bg-warning text-dark me-1" style="cursor:pointer" onclick="filtrarCanciones('${archivo.id}', 'emociones', '${e}')">${e}</span>`;
    });
    filtrosCategorias += `<br>`;
  }
  // Lugares
  if (lugaresSet.size) {
    filtrosCategorias += `<span class="me-2">Lugares:</span>`;
    lugaresSet.forEach(l=>{
      filtrosCategorias += `<span class="badge bg-primary me-1" style="cursor:pointer" onclick="filtrarCanciones('${archivo.id}', 'lugares', '${l}')">${l}</span>`;
    });
    filtrosCategorias += `<br>`;
  }
  filtrosCategorias += `<span class="badge bg-light text-dark mt-2" style="cursor:pointer" onclick="filtrarCanciones('${archivo.id}', '', '')">Quitar filtros</span>`;
  filtrosCategorias += `</div>`;

  // --- Aplicar filtro ---
  let cancionesFiltradas = canciones;
  if (filtro && filtro.tipo && filtro.valor) {
    if (filtro.tipo === 'estado') {
      cancionesFiltradas = cancionesFiltradas.filter(c=>calcularEstadoCancion(c) === filtro.valor);
    } else if (['motivos','emociones','lugares'].includes(filtro.tipo)) {
      cancionesFiltradas = cancionesFiltradas.filter(c=>(c[filtro.tipo]||[]).includes(filtro.valor));
    }
  }

  let filtroActivoHTML = "";
  if (filtro && filtro.tipo && filtro.valor) {
    let label = '';
    if (filtro.tipo === 'estado') {
      const est = estados.find(e=>e.key===filtro.valor);
      label = est ? est.label : filtro.valor;
    } else {
      label = filtro.valor;
    }
    filtroActivoHTML = `<div class="mb-2"><span class="badge bg-info">Filtro activo: ${label}</span> <button class="btn btn-sm btn-light" onclick="filtrarCanciones('${archivo.id}', '', '')">Quitar filtro</button></div>`;
  }

  let html = `
    <button class="btn btn-link mb-2 text-info" onclick="renderVistaArchivos()"><i class="bi bi-arrow-left"></i> Volver</button>
    <h4>${archivo.titulo}</h4>
    <div class="mb-2">${archivo.descripcion||""}</div>
    ${filtrosEstado}
    ${filtrosCategorias}
    ${filtroActivoHTML}
    <button class="btn btn-success mb-3" onclick="abrirModalCancion('${archivo.id}')">+ Agregar Canción</button>
    <div>
      ${cancionesFiltradas.length === 0 ? `<div class="alert alert-info">No hay canciones para este filtro.</div>` : ""}
      ${cancionesFiltradas.map(c=>{
        const estKey = calcularEstadoCancion(c);
        const est = estados.find(e=>e.key===estKey);
        return `
        <div class="card mb-2">
          <div class="card-body">
            <h5>${c.titulo} ${est ? `<span class="badge bg-${est.color} ms-2">${est.label}</span>` : ""}</h5>
            ${c.audio?`<audio controls src="${c.audio}" style="width:100%;"></audio>`:""}
            <div class="mt-2">
              <button class="btn btn-sm btn-info me-2" onclick="verDetalleCancion('${archivo.id}','${c.id}')"><i class="bi bi-info-circle"></i> Detalle</button>
              <button class="btn btn-sm btn-secondary" onclick="editarCancion('${archivo.id}','${c.id}')"><i class="bi bi-pencil"></i> Editar</button>
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;
  $("#vistaArchivoDetalle").html(html).show();
  $("#vistaArchivos").hide();
  window._archivoAbiertoId = archivo.id;
}

window.filtrarCanciones = function(archivoId, tipo, valor) {
  const archivo = loadArchivos().find(a=>a.id===archivoId);
  if (!archivo) return;
  if (!tipo || !valor) {
    renderVistaArchivoDetalle(archivo, {});
  } else {
    renderVistaArchivoDetalle(archivo, {tipo, valor});
  }
}

// ---- Modal: Crear/Editar Archivo ----
let archivoModal = null;
$(document).ready(function(){
  archivoModal = new bootstrap.Modal(document.getElementById('archivoModal'));
  cancionModal = new bootstrap.Modal(document.getElementById('cancionModal'));
  detalleCancionModal = new bootstrap.Modal(document.getElementById('detalleCancionModal'));
  renderVistaArchivos();
  $('#btnAddArchivo').on('click', function() {
    limpiarArchivoForm();
    $('#archivoModalTitle').text("Nuevo Archivo");
    archivoModal.show();
  });
  $('#archivoForm').on('submit', function(e){
    e.preventDefault();
    guardarArchivo();
    archivoModal.hide();
    renderVistaArchivos();
  });
});

function limpiarArchivoForm() {
  $('#archivoId').val('');
  $('#archivoTitulo').val('');
  $('#archivoDescripcion').val('');
}
window.editarArchivo = function(id) {
  const archivo = loadArchivos().find(a=>a.id===id);
  if (!archivo) return;
  $('#archivoId').val(archivo.id);
  $('#archivoTitulo').val(archivo.titulo);
  $('#archivoDescripcion').val(archivo.descripcion||"");
  $('#archivoModalTitle').text("Editar Archivo");
  archivoModal.show();
};
function guardarArchivo() {
  const id = $('#archivoId').val() || Date.now().toString();
  const titulo = $('#archivoTitulo').val().trim();
  if (!titulo) return alert("El título es obligatorio");
  let archivos = loadArchivos();
  let arch = archivos.find(a=>a.id===id) || {id, canciones:[]};
  arch.titulo = titulo;
  arch.descripcion = $('#archivoDescripcion').val();
  const idx = archivos.findIndex(a=>a.id===id);
  if(idx>=0) archivos[idx]=arch;
  else archivos.push(arch);
  saveArchivos(archivos);
}

// ---- Modal: Crear/Editar Canción ----
let cancionModal = null;
let cancionMemorias = [];
window.abrirModalCancion = function(archivoId) {
  limpiarCancionForm();
  $('#cancionModalTitle').text("Nueva Canción");
  $('#cancionForm').data("archivoId", archivoId);
  cancionModal.show();
}
function limpiarCancionForm() {
  $('#cancionId').val('');
  $('#cancionTitulo').val('');
  $('#cancionLetra').val('');
  $('#cancionAudioFile').val('');
  $('#cancionAudioData').val('');
  $('#cancionAudio').val('');
  $('#cancionMotivos').val('');
  $('#cancionEmociones').val('');
  $('#cancionLugares').val('');
  $('#cancionCreditos').val('');
  $('#cancionSobre').val('');
  $('#cancionMemoriaImg').val('');
  $('#cancionMemoriaDesc').val('');
  cancionMemorias = [];
  renderMemoriasLista();
}

$('#cancionAudioFile').on('change', function(e){
  const file = e.target.files[0];
  if (file) {
    if (file.size > 512 * 1024) {
      alert("El archivo de audio es demasiado grande (máximo 500KB)");
      $('#cancionAudioFile').val('');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
      $('#cancionAudioData').val(evt.target.result);
    }
    reader.readAsDataURL(file);
  } else {
    $('#cancionAudioData').val('');
  }
});
$('#btnAddMemoria').on('click', function(){
  const fileInput = $('#cancionMemoriaImg')[0];
  const desc = $('#cancionMemoriaDesc').val();
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (file.size > 512 * 1024) {
      alert("Imagen demasiado grande (máximo 500KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = function(evt){
      cancionMemorias.push({ imagen: evt.target.result, descripcion: desc });
      renderMemoriasLista();
      $('#cancionMemoriaImg').val('');
      $('#cancionMemoriaDesc').val('');
    };
    reader.readAsDataURL(file);
  } else {
    alert("Selecciona una imagen");
  }
});
function renderMemoriasLista() {
  $("#memoriasLista").html(
    cancionMemorias.map((m,i)=>`
      <div class="d-flex align-items-center mb-1">
        <img src="${m.imagen}" style="max-width:48px;max-height:48px;" class="me-2 rounded">
        <div>${m.descripcion||""}</div>
        <button type="button" class="btn btn-sm btn-danger ms-2" onclick="borrarMemoria(${i})"><i class="bi bi-x"></i></button>
      </div>
    `).join('')
  );
}
window.borrarMemoria = function(idx){
  cancionMemorias.splice(idx, 1);
  renderMemoriasLista();
};

$('#cancionForm').on('submit', function(e){
  e.preventDefault();
  const archivoId = $(this).data("archivoId");
  let archivos = loadArchivos();
  let arch = archivos.find(a=>a.id===archivoId);
  if (!arch) return;
  let canciones = arch.canciones||[];
  const id = $('#cancionId').val() || Date.now().toString();
  let cancion = canciones.find(c=>c.id===id) || {id};
  cancion.titulo = $('#cancionTitulo').val();
  cancion.letra = $('#cancionLetra').val();
  cancion.audio = $('#cancionAudioData').val() || $('#cancionAudio').val();
  cancion.motivos = $('#cancionMotivos').val().split(',').map(x=>x.trim()).filter(Boolean);
  cancion.emociones = $('#cancionEmociones').val().split(',').map(x=>x.trim()).filter(Boolean);
  cancion.lugares = $('#cancionLugares').val().split(',').map(x=>x.trim()).filter(Boolean);
  cancion.creditos = $('#cancionCreditos').val();
  cancion.sobre = $('#cancionSobre').val();
  cancion.memorias = [...cancionMemorias];
  const idx = canciones.findIndex(c=>c.id===id);
  if(idx>=0) canciones[idx]=cancion;
  else canciones.push(cancion);
  arch.canciones = canciones;
  saveArchivos(archivos);
  cancionModal.hide();
  renderVistaArchivoDetalle(arch);
});

window.editarCancion = function(archivoId, cancionId) {
  let archivos = loadArchivos();
  let arch = archivos.find(a=>a.id===archivoId);
  if (!arch) return;
  let cancion = arch.canciones.find(c=>c.id===cancionId);
  if (!cancion) return;
  $('#cancionId').val(cancion.id);
  $('#cancionTitulo').val(cancion.titulo||"");
  $('#cancionLetra').val(cancion.letra||"");
  $('#cancionAudioFile').val('');
  $('#cancionAudioData').val('');
  $('#cancionAudio').val(cancion.audio||"");
  $('#cancionMotivos').val((cancion.motivos||[]).join(','));
  $('#cancionEmociones').val((cancion.emociones||[]).join(','));
  $('#cancionLugares').val((cancion.lugares||[]).join(','));
  $('#cancionCreditos').val(cancion.creditos||"");
  $('#cancionSobre').val(cancion.sobre||"");
  cancionMemorias = [...(cancion.memorias||[])];
  renderMemoriasLista();
  $('#cancionModalTitle').text("Editar Canción");
  $('#cancionForm').data("archivoId", archivoId);
  cancionModal.show();
};

let detalleCancionModal = null;
window.verDetalleCancion = function(archivoId, cancionId) {
  let archivos = loadArchivos();
  let arch = archivos.find(a=>a.id===archivoId);
  if (!arch) return;
  let c = arch.canciones.find(c=>c.id===cancionId);
  if (!c) return;
  let estKey = calcularEstadoCancion(c);
  let est = estados.find(e=>e.key===estKey);
  let html = `
    <h5>${c.titulo} ${est?`<span class="badge bg-${est.color} ms-2">${est.label}</span>`:""}</h5>
    ${c.audio?`<audio controls src="${c.audio}" style="width:100%;"></audio>`:""}
    <pre class="bg-dark mt-2">${c.letra||""}</pre>
    <div class="mt-2"><b>Motivos:</b> ${(c.motivos||[]).map(m=>`<span class="badge bg-success me-1">${m}</span>`).join('')}</div>
    <div><b>Emociones:</b> ${(c.emociones||[]).map(e=>`<span class="badge bg-warning text-dark me-1">${e}</span>`).join('')}</div>
    <div><b>Lugares:</b> ${(c.lugares||[]).map(l=>`<span class="badge bg-primary me-1">${l}</span>`).join('')}</div>
    <div class="mt-2"><b>Créditos:</b> ${c.creditos||"<span class='text-muted'>No especificado</span>"}</div>
    <div class="mt-2"><b>Sobre la canción:</b><br>${c.sobre||"<span class='text-muted'>No especificado</span>"}</div>
    <div class="mt-2"><b>Memorias:</b>
      <div class="row">
        ${(c.memorias||[]).map(m=>`
          <div class="col-4 mb-2">
            <img src="${m.imagen}" class="img-fluid rounded mb-1">
            <div class="text-white-50" style="font-size:0.9em">${m.descripcion||""}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  $('#detalleCancionBody').html(html);
  detalleCancionModal.show();
};

(function initDemoData(){
  if (!localStorage.getItem(LS_ARCHIVOS)) {
    saveArchivos([
      {
        id: "archivo1",
        titulo: "Archivo de ejemplo",
        descripcion: "Este es un archivo de muestra.",
        canciones: [
          {
            id: "cancion1",
            titulo: "Canción de muestra",
            letra: "Letra de ejemplo...",
            audio: "",
            motivos: ["Amor"],
            emociones: ["Alegría"],
            lugares: ["Playa"],
            creditos: "Letra: X. Música: Y",
            sobre: "Compuesta en verano.",
            memorias: []
          }
        ]
      }
    ]);
  }
})();