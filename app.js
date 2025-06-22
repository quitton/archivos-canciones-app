// --- Estados y reglas ---
const estados = [
  { key: 'germinando', label: 'Germinando', color: 'success' },
  { key: 'brotando', label: 'Brotando', color: 'primary' },
  { key: 'enraizado', label: 'Enraizado', color: 'warning' },
  { key: 'florecido', label: 'Florecido', color: 'danger' }
];

let categoriasBase = {
  motivos: ["Amor", "Fiesta", "Despedida"],
  emociones: ["Tristeza", "Alegría", "Nostalgia"],
  lugares: ["Playa", "Ciudad", "Montaña"]
};

const LS_ARCHIVOS = "archivosCanciones";
const LS_CATEGORIAS = "categoriasCanciones";

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

function calcularEstado(archivo) {
  if (!archivo.titulo) return null;
  if (archivo.letra && archivo.audio) {
    if (archivo.interprete && archivo.creditos) {
      if (
        archivo.imagen &&
        (archivo.motivos && archivo.motivos.length) &&
        (archivo.emociones && archivo.emociones.length) &&
        (archivo.lugares && archivo.lugares.length)
      ) {
        return 'florecido';
      }
      return 'enraizado';
    }
    return 'brotando';
  }
  return 'germinando';
}

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
      const count = archivos.filter(a => Array.isArray(a[grupo]) && a[grupo].includes(cat)).length;
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
              ${a.audio ? `<audio controls src="${a.audio}" style="width:100%;" class="mt-1"></audio>` : ""}
              <div class="mt-2">
                ${(a.motivos||[]).map(m=>`<span class="badge bg-success me-1">${m}</span>`).join('')}
                ${(a.emociones||[]).map(e=>`<span class="badge bg-warning text-dark me-1">${e}</span>`).join('')}
                ${(a.lugares||[]).map(l=>`<span class="badge bg-primary me-1">${l}</span>`).join('')}
              </div>
            </div>
            <button class="btn btn-outline-secondary btn-sm ms-2" onclick="editarArchivo('${a.id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-outline-info btn-sm ms-2" onclick="verDetalleArchivo('${a.id}')"><i class="bi bi-info-circle"></i></button>
          </div>
        </div>
      </div>
    `;
  });
  $("#listadoArchivos").html(html);
}
window.filtrarPorEstado = function(estadoKey) {
  const archivos = loadArchivos().filter(a => calcularEstado(a) === estadoKey);
  renderListado(archivos);
};
window.filtrarPorCategoria = function(grupo, categoria) {
  const archivos = loadArchivos().filter(a => Array.isArray(a[grupo]) && a[grupo].includes(categoria));
  renderListado(archivos);
};
let archivoModal = null;
let sugerirModal = null;
let detalleAudioModal = null;
$(document).ready(function(){
  archivoModal = new bootstrap.Modal(document.getElementById('archivoModal'));
  sugerirModal = new bootstrap.Modal(document.getElementById('sugerirModal'));
  detalleAudioModal = new bootstrap.Modal(document.getElementById('detalleAudioModal'));
  renderEstadosResumen();
  renderCategoriasResumen();
  renderListado(loadArchivos());
  $('#tabEstados').on('click', ()=>renderListado([]));
  $('#tabCategorias').on('click', ()=>renderListado([]));
  $('#btnAddFile').on('click', function() {
    limpiarFormulario();
    $('#archivoModalTitle').text("Nuevo Archivo");
    archivoModal.show();
  });
  $('#archivoForm').on('submit', function(e){
    e.preventDefault();
    guardarArchivo();
    archivoModal.hide();
    renderEstadosResumen();
    renderCategoriasResumen();
    renderListado(loadArchivos());
  });
  $('#btnSugerir').on('click', function(){
    $('#nombreCategoria').val('');
    sugerirModal.show();
  });
  $('#sugerirForm').on('submit', function(e){
    e.preventDefault();
    sugerirCategoria();
    sugerirModal.hide();
    renderCategoriasResumen();
  });
  $('#audioFile').on('change', function(e){
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        $('#audioData').val(evt.target.result);
        $('#audioData').data('fileInfo', {
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
      reader.readAsDataURL(file);
    } else {
      $('#audioData').val('');
      $('#audioData').removeData('fileInfo');
    }
  });
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
  $('#audioData').removeData('fileInfo');
}
window.editarArchivo = function(id) {
  const archivo = loadArchivos().find(a => a.id === id);
  if (!archivo) return;
  $('#archivoId').val(archivo.id);
  $('#titulo').val(archivo.titulo);
  $('#letra').val(archivo.letra || '');
  $('#audioData').val(archivo.audio || '');
  $('#audioFile').val('');
  $('#audio').val('');
  $('#interprete').val(archivo.interprete || '');
  $('#creditos').val(archivo.creditos || '');
  $('#imagenData').val(archivo.imagen || '');
  $('#imagenFile').val('');
  $('#imagen').val('');
  $('#motivos').val(Array.isArray(archivo.motivos) ? archivo.motivos.join(',') : '');
  $('#emociones').val(Array.isArray(archivo.emociones) ? archivo.emociones.join(',') : '');
  $('#lugares').val(Array.isArray(archivo.lugares) ? archivo.lugares.join(',') : '');
  $('#archivoModalTitle').text("Editar Archivo");
  archivoModal.show();
};
function guardarArchivo() {
  const id = $('#archivoId').val() || Date.now().toString();
  const audioFileInfo = $('#audioData').data('fileInfo') || {};
  const audio = $('#audioData').val() || $('#audio').val();
  const imagen = $('#imagenData').val() || $('#imagen').val();
  const motivos = $('#motivos').val().split(',').map(x=>x.trim()).filter(Boolean);
  const emociones = $('#emociones').val().split(',').map(x=>x.trim()).filter(Boolean);
  const lugares = $('#lugares').val().split(',').map(x=>x.trim()).filter(Boolean);

  // Solo título es obligatorio
  const titulo = $('#titulo').val().trim();
  if (!titulo) {
    alert("El título es obligatorio.");
    return;
  }

  const archivo = {
    id,
    titulo: titulo,
    letra: $('#letra').val(),
    audio: audio,
    interprete: $('#interprete').val(),
    creditos: $('#creditos').val(),
    imagen: imagen,
    motivos: motivos,
    emociones: emociones,
    lugares: lugares,
    audioFileInfo: audioFileInfo,
  };

  let archivos = loadArchivos();
  const idx = archivos.findIndex(a => a.id === id);

  if (idx >= 0) {
    archivos[idx] = archivo;
  } else {
    archivos.push(archivo);
  }
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
window.verDetalleArchivo = function(id) {
  const archivo = loadArchivos().find(a => a.id === id);
  if (!archivo) return;
  let audioMetaHTML = '';
  if (archivo.audioFileInfo && archivo.audioFileInfo.name) {
    audioMetaHTML = `
      <li><b>Nombre de archivo:</b> ${archivo.audioFileInfo.name}</li>
      <li><b>Tamaño:</b> ${(archivo.audioFileInfo.size / 1024).toFixed(1)} KB</li>
      <li><b>Tipo:</b> ${archivo.audioFileInfo.type}</li>
      <li id="duracionAudioDetalle"><b>Duración:</b> <span>Cargando...</span></li>
    `;
  } else {
    audioMetaHTML = `<li><b>Origen:</b> ${archivo.audio ? "URL/Base64" : "No especificado"}</li>`;
  }
  function badgeList(lista, color) {
    return (Array.isArray(lista) ? lista : []).map(c=>`<span class="badge bg-${color} me-1">${c}</span>`).join('');
  }
  const body = `
    <div class="row">
      <div class="col-md-5 mb-2">
        <b>Título:</b> ${archivo.titulo || ""}
        <hr class="my-1">
        <b>Letra:</b><br><pre class="bg-light p-2 rounded">${archivo.letra || ""}</pre>
        <b>Intérprete:</b> ${archivo.interprete || "<span class='text-muted'>No especificado</span>"}
        <br>
        <b>Créditos:</b> ${archivo.creditos || "<span class='text-muted'>No especificado</span>"}
        <hr class="my-1">
        <b>Motivos:</b><br>${badgeList(archivo.motivos, "success")}
        <hr class="my-1">
        <b>Emociones:</b><br>${badgeList(archivo.emociones, "warning")}
        <hr class="my-1">
        <b>Lugares:</b><br>${badgeList(archivo.lugares, "primary")}
      </div>
      <div class="col-md-7">
        <b>Audio:</b>
        ${archivo.audio ? `<audio id="audioDetalle" controls src="${archivo.audio}" style="width:100%;"></audio>` : "<span class='text-muted'>No especificado</span>"}
        <ul class="mt-2">${audioMetaHTML}</ul>
        ${archivo.imagen ? `<b>Imagen de portada:</b><br><img src="${archivo.imagen}" class="img-fluid rounded" style="max-width:200px;">` : ""}
      </div>
    </div>
  `;
  $('#detalleAudioBody').html(body);
  detalleAudioModal.show();
  if (archivo.audioFileInfo && archivo.audioFileInfo.name && archivo.audio) {
    const audioElem = document.getElementById('audioDetalle');
    audioElem.onloadedmetadata = function() {
      const segundos = Math.floor(audioElem.duration % 60).toString().padStart(2,'0');
      const minutos = Math.floor(audioElem.duration / 60);
      $('#duracionAudioDetalle span').text(`${minutos}:${segundos} minutos`);
    }
    if (audioElem.readyState >= 1) {
      audioElem.onloadedmetadata();
    }
  }
}
(function initDemoData(){
  if (!localStorage.getItem(LS_ARCHIVOS)) {
    saveArchivos([
      {
        id: "1", titulo: "La playa", letra: "", audio: "", interprete: "", creditos: "", imagen: "", motivos:[], emociones:[], lugares:[], audioFileInfo:{}
      },
      {
        id: "2", titulo: "Ciudad de luces", letra: "", audio: "", interprete: "", creditos: "", imagen: "https://picsum.photos/seed/ciudad/60", motivos:[], emociones:[], lugares:[], audioFileInfo:{}
      }
    ]);
  }
  if (!localStorage.getItem(LS_CATEGORIAS)) {
    saveCategorias(categoriasBase);
  }
})();
$('#navTabs a').on('shown.bs.tab', function(e){
  renderListado([]);
});