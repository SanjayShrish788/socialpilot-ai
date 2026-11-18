import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { demoWorkspace } from "../src/lib/demo";
test("PostgreSQL migration, atomic snapshots, normalized records and tenant RLS", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create schema auth; create table auth.users(id uuid primary key); create role authenticated; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to authenticated; grant execute on function auth.uid() to authenticated;`,
    );
    const sql = await readFile("supabase/migrations/001_initial.sql", "utf8");
    // PGlite uses built-in gen_random_uuid; pgcrypto extension installation is a Supabase concern.
    await db.exec(sql.replace("create extension if not exists pgcrypto;", ""));
    const alice = "00000000-0000-0000-0000-000000000001",
      bob = "00000000-0000-0000-0000-000000000002";
    await db.query("insert into auth.users values ($1),($2)", [alice, bob]);
    await db.exec(
      "grant select on all tables in schema public to authenticated; set role authenticated;",
    );
    await assert.rejects(
      db.query("select public.save_workspace($1::jsonb)", [
        JSON.stringify(demoWorkspace()),
      ]),
      /Authentication required/,
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      alice,
    ]);
    await db.query("select public.save_workspace($1::jsonb)", [
      JSON.stringify(demoWorkspace()),
    ]);
    const posts = await db.query("select * from public.content_posts");
    assert.equal(posts.rows.length, 2);
    await db.query("select public.save_workspace($1::jsonb)", [
      JSON.stringify(demoWorkspace()),
    ]);
    assert.equal(
      (await db.query("select * from public.content_posts")).rows.length,
      2,
    );
    assert.equal(
      (await db.query("select * from public.snapshot_history")).rows.length,
      2,
    );
    await assert.rejects(
      db.exec("update public.content_posts set status='Approved'"),
      /permission denied/,
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      bob,
    ]);
    assert.equal(
      (await db.query("select * from public.workspace_snapshots")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.content_posts")).rows.length,
      0,
    );
    await db.query("select public.save_workspace($1::jsonb)", [
      JSON.stringify(demoWorkspace()),
    ]);
    assert.equal(
      (await db.query("select * from public.workspaces")).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});
