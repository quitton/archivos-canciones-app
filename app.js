// --- Estados y reglas ---
const estados = [
  { key: 'germinando', label: 'Germinando', color: 'success' },
  { key: 'brotando', label: 'Brotando', color: 'primary' },
  { key: 'enraizado', label: 'Enraizado', color: 'warning' },
  { key: 'florecido', label: 'Florecido', color: 'danger' }
];

// Grupos de categorías iniciales
let categoriasBase = {
  motivos: ["Amor", "Fiesta", "Despedida"],
  emociones: ["Tristeza", "Alegría", "Nostalgia"],
  lugares: ["Playa", "Ciudad", "Montaña"]
};

// --- LocalStorage keys ---
const LS_ARCHIVOS = "archivosCanciones";
const LS_CATEGORIAS = "categoriasCanciones";

// --- Utilidades almacenamiento ---
function loadArchivos() {
  return JSON.parse(localStorage.getItem(LS_ARCHIVOS) || "[]");
}
function saveArchivos(arr) {
  localStorage.setItem(LS_ARCHIVOS, JSON.stringify(arr));
}
function loadCategorias() {
  return JSON.parse(localStorage.getItem(LS_CATEGORIAS) || JSON.stringify(categoriasBase));
}
function saveCategorias(obj) {
  localStorage.setItem(LS_CATEGORIAS, JSON.stringify(obj));
}

// --- Estado calculado según reglas ---
function calcularEstado(archivo) {
  // Germinando: titulo, letra, audio y al menos una categoría en cualquier grupo
  const tieneDatosMinimos = archivo.titulo && archivo.letra && archivo.audio &&
    (archivo.motivos.length || archivo.emociones.length || archivo.lugares.length);

  if (!tieneDatosMinimos) return null;

  // Brotando: además tiene interprete y creditos
  if (archivo.interprete && archivo.creditos) {
    // Enraizado: además tiene imagen
    if (archivo.imagen) {
      // Florecido: además tiene al menos una categoría en cada grupo
      if (archivo.motivos.length && archivo.emociones.length && archivo.lugares.length) {
        return 'florecido';
      }
      return 'enraizado';
    }
    return 'brotando';
  }
  return 'germinando';
}

// --- UI Render ---
function renderEstadosResumen() {
  const archivos = loadArchivos();
  let html = '';
  estados.forEach(est => {
    const count = archivos.filter(a => calcularEstado(a) === est.key).length;
    html += `
      <div class="col-6">
        <div class="card card-estado border-${est.color} text-center" style="cursor:pointer;" onclick="filtrarPorEstado('${est.key}')">
          <div class="card-body py-2">
            <h6 class="card-title text-${est.color}">${est.label}</h6>
            <span class="badge bg-${est.color}">${count}</span>
          </div>
        </div>
      </div>
    `;
  });
  $("#estadosResumen").html(html);
}
function renderCategoriasResumen() {
  const archivos = loadArchivos();
  const categorias = loadCategorias();
  let html = '';
  Object.entries(categorias).forEach(([grupo, arr]) => {
    html += `<h6 class="mt-2 text-muted">${grupo.charAt(0).toUpperCase() + grupo.slice(1)}</h6><div class="d-flex flex-wrap mb-2">`;
    arr.forEach(cat => {
      // Contar archivos que tengan esta categoria en este grupo
      const count = archivos.filter(a => (a[grupo] || []).includes(cat)).length;
      html += `
        <div class="card card-categoria me-1 mb-1 border-info" style="cursor:pointer;" onclick="filtrarPorCategoria('${grupo}','${cat}')">
          <div class="card-body p-2 text-center">
            <span class="badge bg-info">${cat}</span>
            <span class="ms-2 text-secondary">${count}</span>
          </div>
        </div>
      `;
    });
    html += "</div>";
  });
  $("#categoriasResumen").html(html);
}
function renderListado(archivos) {
  if (!archivos.length) {
    $("#listadoArchivos").html(`<div class="alert alert-info">No hay archivos en esta vista</div>`);
    return;
  }
  let html = '';
  archivos.forEach(a => {
    const estado = calcularEstado(a);
    const estLabel = estados.find(e => e.key === estado)?.label || "Sin estado";
    const estColor = estados.find(e => e.key === estado)?.color || "secondary";
    html += `
      <div class="card mb-2">
        <div class="card-body">
          <div class="d-flex align-items-center">
            <div style="min-width:60px;min-height:60px;">
              ${a.imagen ? `<img src="${a.imagen}" class="img-fluid rounded" style="max-width:60px;max-height:60px;">` : `<i class="bi bi-music-note-list text-${estColor}" style="font-size:2.4rem;"></i>`}
            </div>
            <div class="ms-3 flex-grow-1">
              <h6>${a.titulo}</h6>
              <small class="text-muted">${estLabel}</small>
              <audio controls src="${a.audio}" style="width:100%;" class="mt-1"></audio>
              <div class="mt-2">
                ${(a.motivos||[]).map(m=>`<span class="badge bg-success me-1">${m}</span>`).join('')}
                ${(a.emociones||[]).map(e=>`<span class="badge bg-warning text-dark me-1">${e}</span>`).join('')}
                ${(a.lugares||[]).map(l=>`<span class="badge bg-primary me-1">${l}</span>`).join('')}
              </div>
            </div>
            <button class="btn btn-outline-secondary btn-sm ms-2" onclick="editarArchivo('${a.id}')"><i class="bi bi-pencil"></i></button>
          </div>
        </div>
      </div>
    `;
  });
  $("#listadoArchivos").html(html);
}
// --- Filtros ---
window.filtrarPorEstado = function(estadoKey) {
  const archivos = loadArchivos().filter(a => calcularEstado(a) === estadoKey);
  renderListado(archivos);
};
window.filtrarPorCategoria = function(grupo, categoria) {
  const archivos = loadArchivos().filter(a => (a[grupo]||[]).includes(categoria));
  renderListado(archivos);
};
// --- Modal para agregar o editar ---
let archivoModal = null;
let sugerirModal = null;
$(document).ready(function(){
  archivoModal = new bootstrap.Modal(document.getElementById('archivoModal'));
  sugerirModal = new bootstrap.Modal(document.getElementById('sugerirModal'));
  // Inicializar resumen
  renderEstadosResumen();
  renderCategoriasResumen();
  renderListado(loadArchivos());
  // Tabs: limpiar listado
  $('#tabEstados').on('click', ()=>renderListado([]));
  $('#tabCategorias').on('click', ()=>renderListado([]));
  // Botón agregar archivo
  $('#btnAddFile').on('click', function() {
    limpiarFormulario();
    $('#archivoModalTitle').text("Nuevo Archivo");
    archivoModal.show();
  });
  // Modal submit
  $('#archivoForm').on('submit', function(e){
    e.preventDefault();
    guardarArchivo();
    archivoModal.hide();
    renderEstadosResumen();
    renderCategoriasResumen();
    renderListado(loadArchivos());
  });
  // Botón sugerir
  $('#btnSugerir').on('click', function(){
    $('#nombreCategoria').val('');
    sugerirModal.show();
  });
  // Modal sugerir submit
  $('#sugerirForm').on('submit', function(e){
    e.preventDefault();
    sugerirCategoria();
    sugerirModal.hide();
    renderCategoriasResumen();
  });

  // Manejo de archivo de audio
  $('#audioFile').on('change', function(e){
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        $('#audioData').val(evt.target.result);
      }
      reader.readAsDataURL(file);
    } else {
      $('#audioData').val('');
    }
  });
  // Manejo de archivo de imagen
  $('#imagenFile').on('change', function(e){
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        $('#imagenData').val(evt.target.result);
      }
      reader.readAsDataURL(file);
    } else {
      $('#imagenData').val('');
    }
  });
});
// --- Formulario ---
function limpiarFormulario() {
  $('#archivoId').val('');
  $('#titulo').val('');
  $('#letra').val('');
  $('#audioData').val('');
  $('#audioFile').val('');
  $('#audio').val('');
  $('#interprete').val('');
  $('#creditos').val('');
  $('#imagenData').val('');
  $('#imagenFile').val('');
  $('#imagen').val('');
  $('#motivos').val('');
  $('#emociones').val('');
  $('#lugares').val('');
}
window.editarArchivo = function(id) {
  const archivo = loadArchivos().find(a => a.id === id);
  if (!archivo) return;
  $('#archivoId').val(archivo.id);
  $('#titulo').val(archivo.titulo);
  $('#letra').val(archivo.letra);
  // Si existe audio en base64, lo pone en el campo oculto
  $('#audioData').val(archivo.audio || '');
  $('#audioFile').val('');
  $('#audio').val(''); // No se puede mostrar URL/base64 directamente, se deja vacío
  $('#interprete').val(archivo.interprete || '');
  $('#creditos').val(archivo.creditos || '');
  $('#imagenData').val(archivo.imagen || '');
  $('#imagenFile').val('');
  $('#imagen').val('');
  $('#motivos').val((archivo.motivos||[]).join(','));
  $('#emociones').val((archivo.emociones||[]).join(','));
  $('#lugares').val((archivo.lugares||[]).join(','));
  $('#archivoModalTitle').text("Editar Archivo");
  archivoModal.show();
};
function guardarArchivo() {
  const id = $('#archivoId').val() || Date.now().toString();
  // Usa datos base64 si existen, si no, el campo antiguo (por compatibilidad)
  const audio = $('#audioData').val() || $('#audio').val();
  const imagen = $('#imagenData').val() || $('#imagen').val();

  const archivo = {
    id,
    titulo: $('#titulo').val(),
    letra: $('#letra').val(),
    audio: audio,
    interprete: $('#interprete').val(),
    creditos: $('#creditos').val(),
    imagen: imagen,
    motivos: $('#motivos').val().split(',').map(x=>x.trim()).filter(Boolean),
    emociones: $('#emociones').val().split(',').map(x=>x.trim()).filter(Boolean),
    lugares: $('#lugares').val().split(',').map(x=>x.trim()).filter(Boolean)
  };
  let archivos = loadArchivos();
  const idx = archivos.findIndex(a => a.id === id);
  if (idx >= 0) archivos[idx] = archivo;
  else archivos.push(archivo);
  saveArchivos(archivos);
}
function sugerirCategoria() {
  const grupo = $('#grupoCategoria').val();
  const nombre = $('#nombreCategoria').val().trim();
  if (!nombre) return;
  let categorias = loadCategorias();
  if (!categorias[grupo].includes(nombre)) {
    categorias[grupo].push(nombre);
    saveCategorias(categorias);
  }
}
// --- Inicializar datos demo si es la primera vez ---
(function initDemoData(){
  if (!localStorage.getItem(LS_ARCHIVOS)) {
    saveArchivos([
      {
        id: "1", titulo: "La playa", letra: "En la playa todo es mejor...", audio: "", interprete: "", creditos: "", imagen: "", motivos:["Amor"], emociones:[], lugares:["Playa"]
      },
      {
        id: "2", titulo: "Ciudad de luces", letra: "Luces que no se apagan...", audio: "", interprete: "Ana", creditos: "Pedro", imagen: "https://picsum.photos/seed/ciudad/60", motivos:["Despedida"], emociones:["Nostalgia"], lugares:["Ciudad"]
      }
    ]);
  }
  if (!localStorage.getItem(LS_CATEGORIAS)) {
    saveCategorias(categoriasBase);
  }
})();
// Hacer que listado se limpie al cambiar de tab
$('#navTabs a').on('shown.bs.tab', function(e){
  renderListado([]);
});