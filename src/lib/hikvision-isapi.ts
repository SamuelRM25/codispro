/**
 * Hikvision ISAPI Protocol Interface
 * Utilizado para conectarse a terminales DS-KAS261 y controlar puertas y descargar huellas.
 */

// Estas variables deberían vivir en el .env
const HIKVISION_IP = process.env.HIKVISION_IP || "192.168.1.64";
const HIKVISION_USER = process.env.HIKVISION_USER || "admin";
const HIKVISION_PASS = process.env.HIKVISION_PASS || "pass1234";

const BASE_URL = `http://${HIKVISION_IP}`;

/**
 * Función MOCK que simula el uso de Autenticación Digest y envía XML por ISAPI.
 * En producción se requiere usar la librería `axios` y `axios-digest` o custom fetch.
 */
export async function sendCommandISAPI(endpoint: string, method: string = "GET", xmlBody?: string) {
  console.log(`[ISAPI] Conectando a ${BASE_URL}${endpoint} vía ${method}...`);
  // Aquí ocurre la digest authentication loop
  
  return new Promise((resolve) => setTimeout(() => {
    resolve({ status: 200, message: "OK" });
  }, 1000));
}

/**
 * Remote Door Open - Envía un pulso al electroimán
 */
export async function remoteOpenDoor(doorId: number = 1) {
  const xml = `
    <RemoteControlDoor xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
        <cmd>open</cmd>
    </RemoteControlDoor>
  `;
  return await sendCommandISAPI(`/ISAPI/AccessControl/RemoteControl/door/${doorId}`, "PUT", xml);
}

/**
 * Empezar captura de huella (Enrollment) a un ID específico en el dispositivo físico
 */
export async function enrollFingerprint(hikvisionUserId: string) {
  const xml = `
    <FingerPrintEnroll>
      <employeeNo>${hikvisionUserId}</employeeNo>
    </FingerPrintEnroll>
  `;
  // Comando genérico para inicializar captura de huella vía terminal
  return await sendCommandISAPI(`/ISAPI/AccessControl/FingerPrintUpload`, "POST", xml);
}

/**
 * Listener Constante (Long-Polling o Event Stream)
 * En una aplicación Express/Node esto se levanta al inicio y queda escuchando.
 */
export function startAlertStreamListener(onAccessGranted: (workerId: string) => void) {
  console.log("[ISAPI] Abriendo AlertStream contra DS-KAS261...");
  
  // Simulación: Cada cierto tiempo alguien pone la huella
  setInterval(() => {
    // Digamos que el dispositivo nos responde con el ID hikvision "EMP-001"
    const randomAccess = Math.random() > 0.95;
    if (randomAccess) {
      console.log("[ISAPI Event] Movimiento detectado en la puerta (Huella Válida)");
      onAccessGranted("EMP-001");
    }
  }, 10000); // Revisa stream frecuentemente. En realidad la conexión no se cierra.
}
