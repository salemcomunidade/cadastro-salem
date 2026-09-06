export default function ReportHeader({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center text-center gap-1 mb-4">
      <img
        src="/logo-salem.png"
        alt="Comunidade Evangélica Salém"
        className="h-14 sm:h-16 object-contain drop-shadow-sm"
      />
      {title && <h1 className="text-lg sm:text-xl font-bold text-brand-navy mt-1">{title}</h1>}
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}
