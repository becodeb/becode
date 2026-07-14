/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./generated/prisma/client').User | null;
  }
}
