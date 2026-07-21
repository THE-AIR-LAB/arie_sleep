"use client";

import { Ic } from "../ra-icons";
import { ConvList } from "./ConvList";
import type { Conversation } from "./types";

/* ---------------- unified mobile drawer panes ---------------- */
// On mobile every topbar icon opens the one bottom drawer (RightDrawer); these
// two panes back its "Chats" and "Account" tabs, reusing the sidebar markup.
export function ChatsPane({
  convos,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onDeleteMany,
  onRename,
  query,
  setQuery,
}: {
  convos: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onRename: (id: string, title: string) => void;
  query: string;
  setQuery: (v: string) => void;
}) {
  return (
    <div className="drawer-pane">
      <button className="newbtn" onClick={onNew}>
        <span className="nb-ic"><Ic.Plus size={17} /></span> New conversation
      </button>
      <div className="searchwrap">
        <span className="search-ic"><Ic.Search size={15} /></span>
        <input
          className="side-search"
          placeholder="Search conversations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ConvList
        convos={convos}
        activeId={activeId}
        query={query}
        onSelect={onSelect}
        onDelete={onDelete}
        onDeleteMany={onDeleteMany}
        onRename={onRename}
      />
    </div>
  );
}
