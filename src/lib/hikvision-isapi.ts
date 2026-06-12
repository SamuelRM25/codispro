import { hikvisionFetch } from './hikvision-auth'

export async function sendCommandISAPI(
  endpoint: string,
  method: string = "GET",
  xmlBody?: string,
  credentials?: { ip?: string, username?: string, password?: string }
) {
  const ip = credentials?.ip
  const username = credentials?.username
  const password = credentials?.password

  if (!ip || !username || !password) {
    throw new Error("Faltan credenciales de Hikvision (ip, username, password)")
  }

  const url = `http://${ip}${endpoint}`

  console.log(`[ISAPI] Conectando a ${url} vía ${method}...`)

  try {
    const response = await hikvisionFetch(url, {
      method,
      body: xmlBody,
      headers: xmlBody ? { 'Content-Type': 'application/xml' } : {},
    }, { username, password })

    const status = response.status
    const text = await response.text()

    return { status, data: text }
  } catch (error) {
    console.error("[ISAPI Error]", error)
    throw error
  }
}

export async function remoteOpenDoor(doorId: number = 1, credentials?: { ip: string, username: string, password: string }) {
  const xml = `
    <RemoteControlDoor xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
        <cmd>open</cmd>
    </RemoteControlDoor>
  `
  return await sendCommandISAPI(`/ISAPI/AccessControl/RemoteControl/door/${doorId}`, "PUT", xml, credentials)
}

export async function enrollFingerprint(hikvisionUserId: string, credentials?: { ip: string, username: string, password: string }) {
  const xml = `
    <FingerPrintEnroll>
      <employeeNo>${hikvisionUserId}</employeeNo>
    </FingerPrintEnroll>
  `
  return await sendCommandISAPI(`/ISAPI/AccessControl/FingerPrintUpload`, "POST", xml, credentials)
}

export async function getDeviceInfo(credentials?: { ip: string, username: string, password: string }) {
  return await sendCommandISAPI(`/ISAPI/System/deviceInfo`, "GET", undefined, credentials)
}