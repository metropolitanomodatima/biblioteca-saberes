export default function BarraProgreso() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" aria-hidden>
      <div className="h-0.5 w-full overflow-hidden bg-rio-100">
        <div className="h-full w-full bg-rio-500 animar-barra-progreso" />
      </div>
      <div className="flex-1 bg-tierra-900/10 backdrop-blur-[1px] cursor-not-allowed" />
    </div>
  );
}