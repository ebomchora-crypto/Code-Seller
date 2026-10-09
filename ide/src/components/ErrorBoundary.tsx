import { Component, ReactNode } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <div className="p-10 min-h-screen bg-vs-editor text-vs-fg"><h1 className="text-xl font-semibold mb-4">Não foi possível abrir a IDE.</h1><p role="alert" className="error-banner mb-5">{this.state.error.message}</p><p className="text-sm text-vs-dim mb-5">O erro não apaga os projetos salvos no disco. Confira o terminal local para mais detalhes.</p><button className="btn-primary" onClick={() => location.reload()}>Recarregar aplicação</button></div>;
    return this.props.children;
  }
}
