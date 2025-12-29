import React from "react";
type props={
    open:boolean;
    lineNumber:number|null;
    onClose:()=>void ;
    onSubmit:(message:string)=>void;
}

export default function AddCommentModal({
  open,
  lineNumber,
  onClose,
  onSubmit,
}: props) {
  const [value, setValue] = React.useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg w-96 p-4 border border-gray-700">
        <h3 className="font-semibold mb-2">
          Add comment {lineNumber ? `on line ${lineNumber}` : ""}
        </h3>

        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write your comment..."
          className="w-full h-28 bg-gray-800 border border-gray-600 rounded p-2 text-sm"
        />

        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-700 rounded"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (!value.trim()) return;
              onSubmit(value.trim());
              setValue("");
            }}
            className="px-3 py-1 text-sm bg-blue-600 rounded"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}