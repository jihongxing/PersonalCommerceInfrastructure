# Historical Database Assets

`0100_auth_system.sql` is an unregistered authentication prototype. It is retained for historical
reference and is not part of the Drizzle migration journal. Do not apply it to the formal API
database. The current local authentication schema is created by `0027_local_auth.sql` and its
subsequent journaled migrations.

Moving this file does not alter any database or migrate data from the prototype tables. An
environment that independently applied the prototype requires a separate inventory and migration
plan before those historical tables can be retired.
