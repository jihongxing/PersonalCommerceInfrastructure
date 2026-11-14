export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getAdminServerConfiguration } = await import('./lib/server-configuration');
    getAdminServerConfiguration();
  }
}
