// --- Modelo base ---
const LS_ARCHIVOS = "archivosColeccion";
function loadArchivos() {
  return JSON.parse(localStorage.getItem(LS_ARCHIVOS) || "[]");
}
function saveArchivos(arr) {
  localStorage.setItem(LS_ARCHIVOS, JSON.stringify(arr));
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
  renderVistaArchivoDetalle(archivo);
}
function renderVistaArchivoDetalle(archivo) {
  let html = `
    <button class="btn btn-link mb-2 text-info" onclick="renderVistaArchivos()"><i class="bi bi-arrow-left"></i> Volver</button>
    <h4>${archivo.titulo}</h4>
    <div class="mb-2">${archivo.descripcion||""}</div>
    <button class="btn btn-success mb-3" onclick="abrirModalCancion('${archivo.id}')">+ Agregar Canción</button>
    <div>
      ${(archivo.canciones||[]).map(c=>`
        <div class="card mb-2">
          <div class="card-body">
            <h5>${c.titulo}</h5>
            ${c.audio?`<audio controls src="${c.audio}" style="width:100%;"></audio>`:""}
            <div class="mt-2">
              <button class="btn btn-sm btn-info me-2" onclick="verDetalleCancion('${archivo.id}','${c.id}')"><i class="bi bi-info-circle"></i> Detalle</button>
              <button class="btn btn-sm btn-secondary" onclick="editarCancion('${archivo.id}','${c.id}')"><i class="bi bi-pencil"></i> Editar</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  $("#vistaArchivoDetalle").html(html).show();
  $("#vistaArchivos").hide();
  window._archivoAbiertoId = archivo.id;
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

// Limpieza form
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

// Imagen/audio file a base64
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
// ---- Memorias (imágenes) ----
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

// --- Guardar canción ---
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

// --- Editar canción ---
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

// --- Detalle de canción ---
let detalleCancionModal = null;
window.verDetalleCancion = function(archivoId, cancionId) {
  let archivos = loadArchivos();
  let arch = archivos.find(a=>a.id===archivoId);
  if (!arch) return;
  let c = arch.canciones.find(c=>c.id===cancionId);
  if (!c) return;
  let html = `
    <h5>${c.titulo}</h5>
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

// Inicial demo
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