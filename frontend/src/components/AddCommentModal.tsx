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
    <div className="wecode-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]">
      <div className="wecode-enter wecode-dialog w-[560px] max-w-[calc(100vw-2rem)] rounded-[18px] border p-5 shadow-[0_0_0_1px_rgba(148,163,184,0.08),0_24px_60px_rgba(0,0,0,0.4)]">
        <h3 className="mb-4 text-[28px] font-medium leading-tight text-slate-100">
          Add comment on line {lineNumber ?? 1}
        </h3>

        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write your comment..."
          className="wecode-field h-[140px] w-full rounded-xl border p-3 text-base leading-6 outline-none transition placeholder:text-slate-400 focus:border-cyan-400/70"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="wecode-button wecode-button--ghost min-w-[100px] rounded-xl px-5"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (!value.trim()) return;
              onSubmit(value.trim());
              setValue("");
            }}
            disabled={!value.trim()}
            className="wecode-button wecode-button--primary min-w-[100px] rounded-xl px-5 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}