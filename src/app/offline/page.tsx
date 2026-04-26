export default function OfflinePage() {
  return (
    <main className="theme-workspace theme-workspace-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="theme-panel max-w-xl rounded-[32px] p-8 text-center shadow-[0_24px_60px_rgba(2,12,27,0.22)]">
        <p className="text-xs font-bold uppercase tracking-[0.34em] theme-accent">Modo offline</p>
        <h1 className="mt-4 text-3xl font-black theme-text-strong sm:text-4xl">
          Sua conexão caiu
        </h1>
        <p className="mt-4 text-base leading-7 theme-text-body">
          O EderApp está instalado e continua disponível, mas esta tela precisa de internet para
          carregar dados atualizados do catálogo e dos pedidos.
        </p>
        <p className="mt-6 text-sm theme-text-muted">
          Assim que a conexão voltar, recarregue a página para seguir normalmente.
        </p>
      </div>
    </main>
  );
}
