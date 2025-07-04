import { Icons } from "@/components/icons";
import { StatusBoard } from "@/components/status-board";
import { applicationBoardsQuery, statusesQuery } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export function Boards() {
  const { data: boards } = useQuery(applicationBoardsQuery);
  const { data: statuses } = useQuery(statusesQuery);

  // Don't render if data is not available
  if (!boards || !statuses) {
    return (
      <div className="border rounded-lg p-4">
        <span className="horizontal center-v justify-between">
          <h1 className="font-medium">Roadmap</h1>
          <button
            type="button"
            className="button button-small button-secondary"
          >
            <Icons.Filter size={14} />
            Filters
          </button>
        </span>
        <div className="text-center py-8 text-gray-500">Loading roadmap...</div>
      </div>
    );
  }

  return (
    <>
      <span className="horizontal center-v justify-between">
        <h1 className="font-medium">Roadmap</h1>
        <button type="button" className="button button-small button-secondary">
          <Icons.Filter size={14} />
          Filters
        </button>
      </span>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {statuses
          .filter((status) => status.includeInRoadmap)
          .map((status) => (
            <StatusBoard
              key={status.slug}
              status={status}
              items={boards.flatMap((board) =>
                board.feedbacks.filter(
                  (feedback) => feedback.status.slug === status.slug
                )
              )}
              admin={true}
            />
          ))}
      </div>
    </>
  );
}
