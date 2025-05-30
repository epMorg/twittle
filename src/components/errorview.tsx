import Link from "next/link";
import type { NextPage } from "next";

type ErrorViewProps = {
  code: number;
  message: string;
};

const ErrorView = ({ code, message }: ErrorViewProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-bold text-slate-200">{code}</h1>
      <p className="mt-4 text-xl text-slate-400">{message}</p>
      <Link
        href="/"
        className="mt-6 rounded-2xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:bg-slate-800"
      >
        Go Home
      </Link>
    </div>
  );
};

export default ErrorView;