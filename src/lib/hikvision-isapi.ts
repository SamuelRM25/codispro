import { hikvisionFetch } from './hikvision-auth';

// Estas variables son fallbacks. Lo ideal es obtenerlas de la tabla 'Terminal' en la DB.
const HIKVISION_IP = process.env.HIKVISION_IP || "192.168.1.64";
const HIKVISION_USER = process.env.HIKVISION_USER || "admin";
const HIKVISION_PASS = process.env.HIKVISION_PASS || "pass1234";

const BASE_URL = `http://${HIKVISION_IP}`;

/**
 * Envía un comando XML por ISAPI con autenticación real Digest.
 */
export async function sendCommandISAPI(
  endpoint: string, 
  method: string = "GET", 
  xmlBody?: string,
  credentials?: { ip?: string, username?: string, password?: string }
) {
  const ip = credentials?.ip || HIKVISION_IP;
  const username = credentials?.username || HIKVISION_USER;
  const password = credentials?.password || HIKVISION_PASS;
  
  const url = `http://${ip}${endpoint}`;
  
  console.log(`[ISAPI] Conectando a ${url} vía ${method}...`);
  
  try {
    const response = await hikvisionFetch(url, {
      method,
      body: xmlBody,
      headers: xmlBody ? { 'Content-Type': 'application/xml' } : {},
    }, { username, password });

    const status = response.status;
    const text = await response.text();
    
    return { status, data: text };
  } catch (error) {
    console.error("[ISAPI Error]", error);
    throw error;
  }
}

/**
 * Remote Door Open - Envía un pulso al electroimán
 */
export async function remoteOpenDoor(doorId: number = 1, credentials?: any) {
  const xml = `
    <RemoteControlDoor xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
        <cmd>open</cmd>
    </RemoteControlDoor>
  `;
  return await sendCommandISAPI(`/ISAPI/AccessControl/RemoteControl/door/${doorId}`, "PUT", xml, credentials);
}

/**
 * Empezar captura de huella (Enrollment) a un ID específico en el dispositivo físico
 */
export async function enrollFingerprint(hikvisionUserId: string, credentials?: any) {
  const xml = `
    <FingerPrintEnroll>
      <employeeNo>${hikvisionUserId}</employeeNo>
    </FingerPrintEnroll>
  `;
  return await sendCommandISAPI(`/ISAPI/AccessControl/FingerPrintUpload`, "POST", xml, credentials);
}

/**
 * Obtener información básica del dispositivo
 */
export async function getDeviceInfo(credentials?: any) {
  return await sendCommandISAPI(`/ISAPI/System/deviceInfo`, "GET", undefined, credentials);
}
