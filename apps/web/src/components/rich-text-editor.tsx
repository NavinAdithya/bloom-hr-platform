import React from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// React-Quill requires the document object, so we must load it strictly on the client
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill");
    // ForwardRef to ensure compatibility if forms ever need a ref
    const ForwardedQuill = React.forwardRef((props: any, ref) => <RQ ref={ref} {...props} />);
    ForwardedQuill.displayName = "ForwardedQuill";
    return ForwardedQuill;
  },
  { ssr: false, loading: () => <div className="h-48 w-full animate-pulse rounded-xl bg-white/5" /> }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"], // remove formatting button
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
];

export function RichTextEditor({ value, onChange, className = "", placeholder }: RichTextEditorProps) {
  return (
    <div className={`prose-sm sm:prose relative ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="rounded-xl border border-white/10 bg-[#020617] text-white"
      />
      <style>{`
        .ql-toolbar.ql-snow {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.02);
        }
        .ql-container.ql-snow {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: rgba(255,255,255,0.1);
          min-height: 200px;
          font-family: inherit;
        }
        .ql-editor {
          min-height: 200px;
        }
        .ql-snow .ql-stroke {
          stroke: #94a3b8;
        }
        .ql-snow .ql-fill {
          fill: #94a3b8;
        }
        .ql-snow.ql-toolbar button:hover .ql-stroke,
        .ql-snow .ql-toolbar button:hover .ql-stroke,
        .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .ql-snow .ql-toolbar button.ql-active .ql-stroke {
          stroke: #22c55e;
        }
        .ql-snow.ql-toolbar button:hover .ql-fill,
        .ql-snow .ql-toolbar button:hover .ql-fill,
        .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .ql-snow .ql-toolbar button.ql-active .ql-fill {
          fill: #22c55e;
        }
        .ql-snow .ql-picker {
          color: #94a3b8;
        }
        .ql-toolbar.ql-snow svg {
          width: 18px !important;
          height: 18px !important;
          display: inline-block !important;
          vertical-align: top !important;
        }
        .ql-toolbar.ql-snow button {
          padding: 3px 5px !important;
        }
      `}</style>
    </div>
  );
}
