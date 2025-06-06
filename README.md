# Nuts and bolts Twitter Clone using Next.js / tRPC / Prisma / Tailwind

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

The purpose of this repository is to demonstrate my command of a productive, efficient, and modern development stack — leveraging tools like Next.js, tRPC, Prisma, and Tailwind CSS to build robust, scalable applications with end-to-end type safety and great DX.

This project highlights my approach to full-stack development with the T3 stack, focusing on real-world implementation of key strategies and best practices, including:

Rendering Strategies

    Static Site Generation (SSG) via getStaticProps

    Dynamic SSG with getStaticPaths

    Server-Side Rendering (SSR) via getServerSideProps

    Client-Side Rendering (CSR) using tRPC + React Query

    Incremental Static Regeneration (ISR)

Full-Stack Features

    Rate Limiting to prevent abuse and control API usage

    OAuth Authentication via Clerk.dev

    Schema Validation using Zod for type-safe input checking

    End-to-End Type Safety with tRPC, sharing types across client and server

    Informative Error Handling via custom error pages and toast notifications

Getting started:

1. Clone the Repository

`git clone https://github.com/your-username/your-repo-name.git`
`cd your-repo-name`


2. Install Dependencies

Make sure you have Node.js installed (v18 or higher recommended), then run:

`npm install`


3. Set Up Environment Variables

Copy the provided .env.example to a new .env file:

`cp .env.example .env`


4. Generate the Prisma Client

`npx prisma generate`


5. Run the Development Server

`npm run dev`
