import React, { useRef } from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  onChange,
  placeholder = 'Type Your Reply...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleAddLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-gray-50/40 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-100 bg-white text-gray-500">
        <button
          type="button"
          onClick={() => exec('undo')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Undo"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('redo')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Redo"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('strikeThrough')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', 'blockquote')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleAddLink}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Insert Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editable Body */}
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder}
        className="min-h-[360px] p-4 text-sm text-gray-800 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
      />
    </div>
  );
};