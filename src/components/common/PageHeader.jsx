export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-[34px] sm:text-[34px] sm:leading-[40px] font-semibold tracking-[-0.025em] text-ink">
          {title}
        </h1>
        {description && <p className="text-base text-muted mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
