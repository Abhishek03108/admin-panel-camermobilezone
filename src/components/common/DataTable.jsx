import Loader from "./Loader.jsx";
import EmptyState from "./EmptyState.jsx";

/**
 * columns: [{ key, header, render?: (row) => node, className? }]
 */
export default function DataTable({ columns, rows, isLoading, emptyTitle, emptyDescription, rowKey = "id" }) {
  if (isLoading) return <Loader />;
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle || "No records found"} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto -mx-px">
      <table className="w-full text-[15px]">
        <thead>
          <tr className="border-b border-line bg-panel/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left text-sm font-medium text-muted px-5 py-3.5 whitespace-nowrap ${col.headClassName || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} className="border-b border-line last:border-0 hover:bg-panel/60 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={`px-5 py-4 align-middle text-ink ${col.className || ""}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
