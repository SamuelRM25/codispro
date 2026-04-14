import { NextResponse } from 'next/server';
import dgram from 'dgram';

const SADP_ADDR = '239.255.255.250';
const SADP_PORT = 37020;
const TIMEOUT = 3000; // 3 seconds to wait for responses

export async function GET() {
  return new Promise((resolve) => {
    const devices: any[] = [];
    const client = dgram.createSocket('udp4');

    const probePacket = `<?xml version="1.0" encoding="utf-8"?><Probe><Uuid>D6F6A6E4-9D8B-4B7C-A5D8-0F1B2B3C4D5E</Uuid><Types>inquiry</Types></Probe>`;

    client.on('message', (msg) => {
      const xml = msg.toString();
      // Improved case-insensitive XML parsing
      const extract = (tag: string) => {
        const regex = new RegExp(`<${tag}>\\s*(.*?)\\s*</${tag}>`, 'i');
        const match = xml.match(regex);
        return match ? match[1] : null;
      };

      const device = {
        ip: extract('IPv4Address'),
        port: extract('HttpPort') || 80,
        mac: extract('MAC'),
        serial: extract('DeviceSerialNumber'),
        description: extract('DeviceDescription'),
        model: extract('DeviceType'),
        isActivated: extract('Activated') === 'true',
      };

      if (device.ip && !devices.find(d => d.mac === device.mac)) {
        devices.push(device);
      }
    });

    client.on('error', (err) => {
      console.error('SADP Scan Error:', err);
      client.close();
      resolve(NextResponse.json({ error: 'UDP scanning failed', details: err.message }, { status: 500 }));
    });

    // Binding is not strictly necessary for broadcast but good for receiving
    client.bind(0, () => {
      client.setBroadcast(true);
      const message = Buffer.from(probePacket);
      client.send(message, 0, message.length, SADP_PORT, SADP_ADDR);
    });

    setTimeout(() => {
      client.close();
      resolve(NextResponse.json({ devices }));
    }, TIMEOUT);
  });
}
