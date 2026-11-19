import type { Locale } from '@/lib/i18n/dict'

export interface Section { h: string; p: string[] }
export interface LegalDoc { title: string; updated: string; intro: string; sections: Section[] }

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL

const contact = (l: Locale) =>
  CONTACT
    ? (l === 'es' ? `Escríbenos a ${CONTACT}.` : `Email us at ${CONTACT}.`)
    : (l === 'es'
        ? 'Escríbenos a través del formulario “Enviar” de la app, indicando el asunto.'
        : 'Reach us through the app’s Submit form, mentioning the subject.')

export function privacy(l: Locale): LegalDoc {
  if (l === 'es') return {
    title: 'Aviso de privacidad',
    updated: '16 de noviembre de 2026',
    intro: 'Murales PDC es un mapa comunitario del arte urbano de Playa del Carmen, Quintana Roo, México. Este aviso explica qué datos tratamos, para qué y cuáles son tus derechos conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.',
    sections: [
      { h: '1. Responsable', p: ['El responsable del tratamiento de tus datos personales es la persona u organización que opera Murales PDC (“nosotros”).', contact('es')] },
      { h: '2. Qué datos recopilamos', p: [
        'Envíos: las fotos que subes, la ubicación (dirección escrita, punto en el mapa, tu ubicación si decides compartirla o los datos de GPS de la foto) y, si quieres, título, artista y notas.',
        'Comentarios, votos y “me gusta”: el texto y, de forma opcional, un nombre que elijas mostrar. Para frenar el spam y contar un solo voto o “me gusta” por persona, guardamos un resumen cifrado e irreversible de tu dirección IP (no la IP en sí) y, para los “me gusta”, un identificador aleatorio que se guarda en tu dispositivo.',
        'Cuenta (opcional): tu correo electrónico, solo si decides iniciar sesión. Si formas parte del equipo de moderación y activas las alertas, también guardamos la dirección de notificaciones de tu navegador.',
        'En tu dispositivo: tu lista de recorrido, tus “me gusta”, un identificador aleatorio del dispositivo y si ya permitiste la ubicación (almacenamiento local), tu idioma (cookie) y, si inicias sesión, cookies de sesión.',
        'Estadísticas de uso: qué páginas se visitan, de dónde llega la gente (por ejemplo, un enlace de WhatsApp o Instagram), el país aproximado, el tipo de dispositivo y navegador, y acciones como guardar un mural o crear un recorrido. Se vinculan solo a un identificador aleatorio del dispositivo, no a una persona, y no guardamos tu dirección IP.',
        'Datos técnicos: dirección IP y registros básicos que procesan nuestros proveedores de alojamiento.',
        'No usamos publicidad ni rastreadores de terceros, y no vendemos tus datos.',
      ] },
      { h: '3. Para qué los usamos', p: ['Para mostrar los murales y fotos enviados, verificar ubicaciones, moderar contenido, permitirte iniciar sesión, responder tus solicitudes y mantener la seguridad del servicio.'] },
      { h: '4. Tus fotos', p: [
        'Al subir una foto nos autorizas, sin exclusividad, a almacenarla, reproducirla, redimensionarla y mostrarla dentro de Murales PDC, con el crédito que indiques, mientras el contenido esté publicado. Sigues siendo el titular de tus fotos y puedes pedir que las retiremos.',
        'Antes de subir, tu navegador elimina de la foto los metadatos (incluido el GPS). Si compartes una ubicación, solo guardamos las coordenadas que elijas.',
      ] },
      { h: '5. Fotos de otras fuentes', p: ['Algunas fotos que se muestran hoy provienen de fuentes públicas y se acreditan cuando conocemos la fuente. Son contenido provisional de esta versión temprana y serán reemplazadas por fotos propias o de colaboradores. Si eres titular de una foto o de una obra y quieres que se retire o se acredite de otra forma, escríbenos y la atenderemos con prontitud.', contact('es')] },
      { h: '6. Con quién compartimos datos', p: [
        'Proveedores que necesitamos para operar: Supabase (base de datos, almacenamiento y acceso), Vercel (alojamiento) y OpenFreeMap/OpenStreetMap (mosaicos del mapa, que reciben tu IP y el área que consultas).',
        'Si abres o pegas enlaces de Google Maps o Apple Maps, esos servicios se rigen por sus propias políticas.',
        'El contenido que publicas (murales, fotos, comentarios y nombres que elijas mostrar) es visible para cualquier persona. También podemos compartir datos si una autoridad competente lo exige.',
      ] },
      { h: '7. Transferencias internacionales', p: ['Nuestros proveedores pueden almacenar o procesar datos fuera de México, incluidos Estados Unidos y otros países.'] },
      { h: '8. Conservación', p: ['Conservamos los envíos mientras se revisan y mientras estén publicados; los comentarios hasta que se eliminen; la cuenta hasta que solicites borrarla. Los registros técnicos los conservan nuestros proveedores por periodos limitados.'] },
      { h: '9. Tus derechos (ARCO)', p: [
        'Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición, así como revocar tu consentimiento o limitar el uso de tus datos, escribiéndonos con tu solicitud y los datos necesarios para identificarte.',
        contact('es'),
        'Si consideras que tus derechos no fueron atendidos, puedes acudir a la autoridad de protección de datos personales competente en México.',
      ] },
      { h: '10. Menores de edad', p: ['El servicio no está dirigido a menores de 13 años. Quienes tengan menos de 18 años deben usarlo con permiso de su madre, padre o tutor.'] },
      { h: '11. Seguridad', p: ['Aplicamos medidas razonables para proteger tus datos; ningún sistema es completamente seguro.'] },
      { h: '12. Cambios a este aviso', p: ['Podemos actualizar este aviso. Publicaremos la versión vigente aquí con su fecha de actualización.'] },
    ],
  }
  return {
    title: 'Privacy Notice',
    updated: 'November 16, 2026',
    intro: 'Murales PDC is a community map of street art in Playa del Carmen, Quintana Roo, Mexico. This notice explains what data we handle, why, and your rights under Mexico’s Federal Law on the Protection of Personal Data Held by Private Parties.',
    sections: [
      { h: '1. Who is responsible', p: ['The party responsible for your personal data is the person or organisation that operates Murales PDC (“we”).', contact('en')] },
      { h: '2. What we collect', p: [
        'Submissions: the photos you upload, the location (typed address, map pin, your device location if you choose to share it, or GPS data in the photo) and, optionally, a title, artist and notes.',
        'Comments, votes and likes: the text and, optionally, a name you choose to display. To limit spam and count one vote or like per person, we store a one-way hash of your IP address (not the address itself) and, for likes, a random ID kept on your device.',
        'Account (optional): your email address, only if you choose to sign in. If you are on the moderation team and turn on alerts, we also store your browser’s notification address.',
        'On your device: your tour list, your likes, a random device ID and whether you already allowed location (local storage), your language (cookie) and, if you sign in, session cookies.',
        'Usage statistics: which pages are visited, where people arrive from (for example a WhatsApp or Instagram link), approximate country, device and browser type, and actions such as saving a mural or starting a tour. These are linked only to a random device ID, not to a person, and we don’t store your IP address.',
        'Technical data: IP address and basic logs processed by our hosting providers.',
        'We don’t use advertising or third-party trackers, and we don’t sell your data.',
      ] },
      { h: '3. How we use it', p: ['To display submitted murals and photos, verify locations, moderate content, let you sign in, respond to your requests and keep the service secure.'] },
      { h: '4. Your photos', p: [
        'When you upload a photo you give us a non-exclusive licence to store, reproduce, resize and display it within Murales PDC, with the credit you provide, for as long as the content is published. You remain the owner of your photos and can ask us to remove them.',
        'Before upload, your browser strips the photo’s metadata (including GPS). If you share a location, we only store the coordinates you choose.',
      ] },
      { h: '5. Photos from other sources', p: ['Some photos shown today come from public sources and are credited where we know the source. They are placeholder content for this early version and will be replaced with our own or contributors’ photos. If you own a photo or artwork and want it removed or credited differently, contact us and we will act promptly.', contact('en')] },
      { h: '6. Who we share data with', p: [
        'Service providers we need to run the app: Supabase (database, storage and sign-in), Vercel (hosting) and OpenFreeMap/OpenStreetMap (map tiles, which receive your IP address and the area you view).',
        'If you open or paste Google Maps or Apple Maps links, those services are governed by their own policies.',
        'Content you publish (murals, photos, comments and any name you choose to display) is visible to everyone. We may also disclose data if a competent authority requires it.',
      ] },
      { h: '7. International transfers', p: ['Our providers may store or process data outside Mexico, including in the United States and other countries.'] },
      { h: '8. Retention', p: ['We keep submissions while they are reviewed and while published; comments until deleted; your account until you ask us to delete it. Technical logs are kept by our providers for limited periods.'] },
      { h: '9. Your rights (ARCO)', p: [
        'You can exercise your rights of access, rectification, cancellation (deletion) and objection, and withdraw consent or limit the use of your data, by writing to us with your request and enough information to identify you.',
        contact('en'),
        'If you believe your rights were not respected, you may go to the competent data protection authority in Mexico.',
      ] },
      { h: '10. Children', p: ['The service is not directed to children under 13. Anyone under 18 should use it with a parent or guardian’s permission.'] },
      { h: '11. Security', p: ['We take reasonable measures to protect your data; no system is completely secure.'] },
      { h: '12. Changes to this notice', p: ['We may update this notice. The current version, with its date, will always be published here.'] },
    ],
  }
}

export function terms(l: Locale): LegalDoc {
  if (l === 'es') return {
    title: 'Términos y condiciones',
    updated: '18 de noviembre de 2026',
    intro: 'Al usar Murales PDC aceptas estos términos. Si no estás de acuerdo, por favor no uses la app.',
    sections: [
      { h: '1. Qué es Murales PDC', p: ['Es un mapa comunitario e informativo del arte urbano de Playa del Carmen. No garantizamos que la información, las ubicaciones o la existencia de los murales sea exacta, completa o vigente: los murales pueden moverse, cubrirse o desaparecer, y muchas ubicaciones son aproximadas o están sin confirmar.'] },
      { h: '2. Seguridad y respeto', p: ['Visita los murales desde espacios públicos y con precaución: respeta el tránsito, la propiedad privada y a las personas. No ingreses a propiedades sin permiso ni te subas a muros o estructuras. Eres responsable de tu seguridad.'] },
      { h: '3. Tu contenido', p: [
        'Eres responsable de lo que envías (fotos, ubicaciones, comentarios). Declaras que tomaste las fotos o tienes permiso para compartirlas, y que no infringen derechos de terceros.',
        'Nos otorgas una licencia no exclusiva, gratuita y mundial para almacenar, reproducir, redimensionar y mostrar tu contenido en Murales PDC, con el crédito que indiques, mientras esté publicado. Sigues siendo su titular y puedes pedir que lo retiremos.',
        'No envíes contenido ilegal, ofensivo, engañoso, spam, ni datos personales o imágenes identificables de otras personas sin su permiso.',
      ] },
      { h: '4. Moderación', p: ['Revisamos los envíos y podemos aprobarlos, editarlos, rechazarlos o retirarlos en cualquier momento, sin obligación de justificarlo.'] },
      { h: '5. Derechos de los artistas', p: ['Los murales son obras de sus artistas y no reclamamos su titularidad. Acreditamos a los artistas y a quienes toman las fotos cuando conocemos su identidad. Si eres titular de una obra o foto y quieres que se retire o se acredite de otra forma, escríbenos y lo atenderemos con prontitud.', contact('es')] },
      { h: '6. Cuentas', p: ['Iniciar sesión es opcional. Es tu responsabilidad cuidar el acceso a tu correo. Podemos suspender cuentas que hagan un uso indebido del servicio.'] },
      { h: '7. Uso prohibido', p: ['No interfieras con el servicio, no intentes acceder a áreas restringidas, no extraigas datos de forma masiva ni suplantes a otras personas.'] },
      { h: '8. Servicios de terceros', p: ['La app enlaza o usa servicios de terceros (por ejemplo mapas de Google y Apple, OpenStreetMap, Supabase y Vercel). Se rigen por sus propios términos y no somos responsables de ellos.', 'Si decides dejar una propina voluntaria en Ko-fi (ko-fi.com/irainpc), se procesa por completo en Ko-fi, sujeta a sus términos. Las propinas son voluntarias, no reembolsables y no te dan ningún derecho ni beneficio adicional en la app.'] },
      { h: '9. Propiedad intelectual de la app', p: ['El diseño y el software de Murales PDC pertenecen a sus titulares. No puedes copiarlos ni reutilizarlos sin permiso, salvo lo que permitan las licencias de código abierto aplicables.'] },
      { h: '10. Sin garantías', p: ['El servicio se ofrece “tal cual” y “según disponibilidad”, sin garantías de ningún tipo en la medida permitida por la ley.'] },
      { h: '11. Limitación de responsabilidad', p: ['En la medida permitida por la ley, no somos responsables por daños derivados del uso de la app o de la información que contiene. Esto no limita los derechos que la legislación mexicana de protección al consumidor te reconozca.'] },
      { h: '12. Cambios', p: ['Podemos actualizar estos términos. El uso continuado de la app después de un cambio implica que lo aceptas.'] },
      { h: '13. Ley aplicable y jurisdicción', p: ['Estos términos se rigen por las leyes de México. Para cualquier controversia, las partes se someten a los tribunales competentes del Estado de Quintana Roo, sin perjuicio de los derechos que la ley otorgue a los consumidores.'] },
      { h: '14. Contacto', p: [contact('es')] },
    ],
  }
  return {
    title: 'Terms & Conditions',
    updated: 'November 18, 2026',
    intro: 'By using Murales PDC you agree to these terms. If you don’t agree, please don’t use the app.',
    sections: [
      { h: '1. What Murales PDC is', p: ['A community, informational map of street art in Playa del Carmen. We don’t guarantee that information, locations or the existence of any mural is accurate, complete or current: murals can be moved, painted over or removed, and many locations are approximate or unconfirmed.'] },
      { h: '2. Safety and respect', p: ['Visit murals from public spaces and with care: respect traffic, private property and people. Don’t enter property without permission or climb walls or structures. You are responsible for your own safety.'] },
      { h: '3. Your content', p: [
        'You are responsible for what you submit (photos, locations, comments). You confirm you took the photos or have permission to share them, and that they don’t infringe anyone’s rights.',
        'You give us a non-exclusive, royalty-free, worldwide licence to store, reproduce, resize and display your content in Murales PDC, with the credit you provide, for as long as it is published. You remain its owner and can ask us to remove it.',
        'Don’t submit unlawful, offensive, misleading or spam content, or personal data or identifiable images of other people without their permission.',
      ] },
      { h: '4. Moderation', p: ['We review submissions and may approve, edit, reject or remove them at any time, without having to give a reason.'] },
      { h: '5. Artists’ rights', p: ['Murals are the works of their artists and we don’t claim ownership of them. We credit artists and photographers when we know who they are. If you own an artwork or photo and want it removed or credited differently, contact us and we will act promptly.', contact('en')] },
      { h: '6. Accounts', p: ['Signing in is optional. You are responsible for keeping access to your email secure. We may suspend accounts that misuse the service.'] },
      { h: '7. Prohibited use', p: ['Don’t interfere with the service, try to access restricted areas, bulk-scrape data, or impersonate others.'] },
      { h: '8. Third-party services', p: ['The app links to or uses third-party services (for example Google and Apple Maps, OpenStreetMap, Supabase and Vercel). They are governed by their own terms and we are not responsible for them.', 'If you choose to leave a voluntary tip on Ko-fi (ko-fi.com/irainpc), it is processed entirely by Ko-fi under its own terms. Tips are voluntary, non-refundable, and give you no additional rights or benefits in the app.'] },
      { h: '9. Intellectual property in the app', p: ['The design and software of Murales PDC belong to their owners. You may not copy or reuse them without permission, except as allowed by any applicable open-source licences.'] },
      { h: '10. No warranties', p: ['The service is provided “as is” and “as available”, without warranties of any kind to the extent permitted by law.'] },
      { h: '11. Limitation of liability', p: ['To the extent permitted by law, we are not liable for damages arising from use of the app or the information in it. This doesn’t limit any rights Mexican consumer-protection law gives you.'] },
      { h: '12. Changes', p: ['We may update these terms. Continuing to use the app after a change means you accept it.'] },
      { h: '13. Governing law and jurisdiction', p: ['These terms are governed by the laws of Mexico. For any dispute, the parties submit to the competent courts of the State of Quintana Roo, without prejudice to any rights the law gives consumers.'] },
      { h: '14. Contact', p: [contact('en')] },
    ],
  }
}
