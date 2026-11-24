// Opciones de conexión para el adaptador de Postgres (`@prisma/adapter-pg`).
//
// El SSL se activa solo si la URL lo pide con `sslmode=require`, que es el caso
// de la base en Railway. Mandar `ssl` siempre, como se hacía antes, rompe
// contra cualquier Postgres local sin TLS: el servidor responde "The server does
// not support SSL connections" y no hay forma de levantar el proyecto en una
// máquina limpia con una base propia.
//
// El parámetro `sslmode` se saca de la URL porque `pg` lo interpreta por su
// cuenta y, si queda, pide TLS igual.
export function opcionesDeConexion(databaseUrl: string | undefined) {
  const url = databaseUrl ?? '';

  const exigeSsl = /(?:^|[?&])sslmode=(?:require|verify-ca|verify-full)/.test(
    url,
  );

  const sinParametroSsl = url
    .replace(/([?&])sslmode=[^&]*&?/g, (_coincidencia, separador: string) =>
      separador === '?' ? '?' : '',
    )
    .replace(/[?&]$/, '');

  return {
    connectionString: sinParametroSsl,
    ...(exigeSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}
