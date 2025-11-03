import { Plug } from "lucide-react";

export default function CallBack({ runCallback }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 w-full max-w-sm m-auto mt-3">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="p-3 bg-green-100 rounded-lg">
          <Plug className="w-6 h-6 text-green-600" />
        </div>

        {/* Text section */}
        <div className="flex-1">
          <h3 className="text-gray-900 font-semibold text-base">Integration Setup</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect your account with third-party services for automated sync and real-time data updates.
          </p>

          {/* Action button */}
          <button
            onClick={runCallback}
            className="
              mt-3 inline-flex items-center gap-2
              px-4 py-2 
              bg-gradient-to-r from-green-500 to-emerald-600 
              text-white text-sm font-medium
              rounded-lg
              shadow-sm hover:shadow-md
              transition-all duration-300
              hover:from-green-600 hover:to-emerald-700
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
            "
          >
            <Plug className="w-4 h-4" />
            <span>Run Integration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
