import { useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import CreateLeadModal from "../components/CreateLeadModal";

const LeadPage = () => {
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            My Leads
          </h1>

          <p className="mt-1 text-sm text-text-secondary">
            Manage and track all your leads.
          </p>
        </div>

        <button
          onClick={() => setIsCreateLeadOpen(true)}
          className="
            flex items-center gap-2
            rounded-lg
            bg-primary-500
            px-4 py-2.5
            text-sm font-medium
            text-white
            transition
            hover:bg-primary-600
          "
        >
          <Plus size={18} />
          Create Lead
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-text-muted
            "
          />

          <input
            type="text"
            placeholder="Search name, email, phone..."
            className="
              h-11
              w-full
              rounded-lg
              border
              border-border
              bg-surface
              pl-11
              pr-4
              text-sm
              outline-none
              transition
              focus:border-primary-500
              focus:ring-2
              focus:ring-primary-100
            "
          />
        </div>

        {/* Filter */}
        <button
          className="
            flex items-center gap-2
            rounded-lg
            border border-border
            bg-surface
            px-4 py-2.5
            text-sm
            text-text-secondary
            hover:bg-neutral-100
          "
        >
          <SlidersHorizontal size={17} />
          Filters
        </button>

      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">

        <div className="overflow-x-auto">
          <table className="w-full">

            <thead>
              <tr className="border-b border-border bg-neutral-50">

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                  Lead
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                  Phone
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                  Email
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                  Course
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {/* Temporary mock row */}
              <tr className="border-b border-border last:border-0">

                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Riya Shah
                    </p>

                    <p className="text-xs text-text-muted">
                      LD0017
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4 text-sm text-text-secondary">
                  +91 9439623827
                </td>

                <td className="px-5 py-4 text-sm text-text-secondary">
                  riya.shah@gmail.com
                </td>

                <td className="px-5 py-4 text-sm text-text-secondary">
                  MBA
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    LEAD
                  </span>
                </td>

                <td className="px-5 py-4 text-right">
                  <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    View
                  </button>
                </td>

              </tr>

            </tbody>

          </table>
        </div>

      </div>

      {/* Create Lead */}
      {isCreateLeadOpen && (
        <CreateLeadModal
          onClose={() => setIsCreateLeadOpen(false)}
        />
      )}

    </div>
  );
};

export default LeadPage;