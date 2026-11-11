# Operations Admin Web

- Independent Next.js client of the shared `apps/api`; read installed Next.js guides before changing framework conventions.
- ENG-012 authorizes a shell only: no authentication integration, Operations requests, mutations or operational data.
- Do not import backend domain/application/persistence code or connect to PostgreSQL.
- Never put static Operations credentials in JavaScript, public environment variables, URLs or browser storage.
- Offering human-review authority does not follow from Catalog administration authority.
