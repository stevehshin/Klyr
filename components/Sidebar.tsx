"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export interface GridInfo {
  id: string;
  name: string;
  icon?: string | null;
  createdAt: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
  emoji: string;
  isPrivate: boolean;
}

export interface ChannelGroupInfo {
  id: string;
  name: string;
  order: number;
  channels: ChannelInfo[];
}

export interface SidebarProps {
  grids: GridInfo[];
  currentGridId: string;
  onGridSelect: (gridId: string) => void;
  onCreateGrid: () => void;
  onRenameGrid: (gridId: string, newName: string) => void;
  onIconChange?: (gridId: string, icon: string | null) => void;
  onShareGrid: (gridId: string) => void;
  channels: ChannelInfo[];
  channelGroups?: ChannelGroupInfo[];
  ungroupedChannels?: ChannelInfo[];
  currentChannelId: string;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel: () => void;
  onCreateChannelGroup?: () => void;
  onManageChannelGroup?: (groupId: string, groupName: string) => void;
  onStartDM?: () => void;
  hasGrid?: boolean;
  userEmail: string;
  onOpenThemeCustomizer: () => void;
  onOpenSettings?: () => void;
  /** Mobile/tablet: render as overlay with backdrop; show close button and call onClose when selecting or closing */
  isOverlay?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  grids,
  currentGridId,
  onGridSelect,
  onCreateGrid,
  onRenameGrid,
  onIconChange,
  onShareGrid,
  channels,
  channelGroups = [],
  ungroupedChannels = [],
  currentChannelId,
  onChannelSelect,
  onCreateChannel,
  onCreateChannelGroup,
  onManageChannelGroup,
  onStartDM,
  hasGrid = false,
  userEmail,
  onOpenThemeCustomizer,
  onOpenSettings,
  isOverlay = false,
  onClose,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<"grids" | "channels" | "dms">("grids");
  const [editingGridId, setEditingGridId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [iconPickerGridId, setIconPickerGridId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const GRID_ICON_OPTIONS = ["⊞", "▦", "📋", "📁", "🗂️", "📌", "⭐", "🎯", "💼", "🔲", "📊", "🌐", "✏️", "📝", "🏠", "⚡"];

  useEffect(() => {
    if (channelGroups?.length) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        channelGroups.forEach((g) => next.add(g.id));
        return next;
      });
    }
  }, [channelGroups]);

  const handleGridSelect = (gridId: string) => {
    onGridSelect(gridId);
    onClose?.();
  };
  const handleChannelSelect = (channelId: string) => {
    onChannelSelect(channelId);
    onClose?.();
  };

  if (isOverlay) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm md:hidden"
          aria-hidden
          onClick={onClose}
        />
        <div
          className="fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] max-w-[280px] h-full bg-gray-900 border-r border-gray-800 flex flex-col shadow-xl transition-transform duration-200 ease-out md:hidden sidebar-overlay-panel"
          role="dialog"
          aria-label="Navigation menu"
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Klyr" width={32} height={32} />
              <span className="text-white font-bold text-lg">Klyr</span>
            </div>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveSection("grids")}
              className={`flex-1 min-h-[48px] px-4 text-sm font-medium transition-colors ${
                activeSection === "grids"
                  ? "text-white border-b-2 border-primary-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Grids
            </button>
            <button
              onClick={() => setActiveSection("channels")}
              className={`flex-1 min-h-[48px] px-4 text-sm font-medium transition-colors ${
                activeSection === "channels"
                  ? "text-white border-b-2 border-primary-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Channels
            </button>
            <button
              onClick={() => setActiveSection("dms")}
              className={`flex-1 min-h-[48px] px-4 text-sm font-medium transition-colors ${
                activeSection === "dms"
                  ? "text-white border-b-2 border-primary-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              DMs
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {activeSection === "grids" && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Grids</span>
                  <button
                    onClick={() => { onCreateGrid(); onClose?.(); }}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                    aria-label="Create grid"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-1">
                  {grids.map((grid) => (
                    <button
                      key={grid.id}
                      onClick={() => handleGridSelect(grid.id)}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-colors flex items-center gap-2 min-h-[48px] ${
                        grid.id === currentGridId
                          ? "bg-primary-600 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <span className={`w-8 h-8 flex-shrink-0 rounded flex items-center justify-center text-base ${grid.id === currentGridId ? "bg-white/20" : "bg-gray-800/80"}`}>
                        {grid.icon && grid.icon.trim() ? grid.icon.trim() : grid.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate text-sm font-medium">{grid.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeSection === "channels" && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channels</span>
                  <button
                    onClick={onCreateChannel}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                    aria-label="Create channel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                {(channelGroups?.length ? channelGroups : [{ id: "_ungrouped", name: "", order: 0, channels: ungroupedChannels ?? [] }]).map((group) => (
                  <div key={group.id} className="mb-3">
                    {group.name && (
                      <p className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">{group.name}</p>
                    )}
                    <div className="space-y-0.5">
                      {(group.channels ?? []).map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => handleChannelSelect(ch.id)}
                          className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-2 min-h-[48px] ${
                            ch.id === currentChannelId
                              ? "bg-primary-600 text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }`}
                        >
                          <span className="text-lg">{ch.emoji}</span>
                          <span className="truncate text-sm">{ch.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeSection === "dms" && (
              <div className="p-3">
                <button
                  onClick={() => { onStartDM?.(); onClose?.(); }}
                  className="w-full text-left px-3 py-3 rounded-lg min-h-[48px] text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                >
                  <span className="text-lg">💬</span>
                  <span className="text-sm">New conversation</span>
                </button>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-gray-800 flex gap-2">
            <button
              onClick={() => { onOpenThemeCustomizer(); onClose?.(); }}
              className="flex-1 min-h-[44px] px-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Theme
            </button>
            {onOpenSettings && (
              <button
                onClick={() => { onOpenSettings(); onClose?.(); }}
                className="flex-1 min-h-[44px] px-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Settings
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  if (isCollapsed) {
    return (
      <div className="w-16 h-screen bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
          aria-label="Expand sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Collapsed Grid Icons */}
        <div className="mt-8 space-y-2">
          {grids.slice(0, 5).map((grid) => (
            <button
              key={grid.id}
              onClick={() => onGridSelect(grid.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
                grid.id === currentGridId
                  ? "bg-primary-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
              title={grid.name}
            >
              {grid.icon && grid.icon.trim() ? grid.icon.trim() : grid.name.charAt(0).toUpperCase()}
            </button>
          ))}
          <button
            onClick={onCreateGrid}
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            title="Create new grid"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col transition-[width,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Klyr" width={32} height={32} />
          <span className="text-white font-bold text-lg">Klyr</span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-gray-400 hover:text-white transition-colors duration-200 p-1.5 rounded-lg hover:bg-gray-800"
          aria-label="Collapse sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveSection("grids")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeSection === "grids"
              ? "text-white border-b-2 border-primary-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Grids
        </button>
        <button
          onClick={() => setActiveSection("channels")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeSection === "channels"
              ? "text-white border-b-2 border-primary-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Channels
        </button>
        <button
          onClick={() => setActiveSection("dms")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeSection === "dms"
              ? "text-white border-b-2 border-primary-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          DMs
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === "grids" && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Your Grids
              </span>
              <button
                onClick={onCreateGrid}
                className="text-gray-400 hover:text-white transition-colors"
                title="Create new grid"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-1">
              {grids.map((grid) => (
                <div key={grid.id} className="relative group">
                  {editingGridId === grid.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editingName.trim()) {
                          onRenameGrid(grid.id, editingName);
                          setEditingGridId(null);
                        }
                      }}
                      className="px-3 py-2"
                    >
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => {
                          if (editingName.trim()) {
                            onRenameGrid(grid.id, editingName);
                          }
                          setEditingGridId(null);
                        }}
                        className="w-full px-2 py-1 text-sm bg-gray-800 text-white border border-primary-500 rounded focus:outline-none"
                        autoFocus
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => onGridSelect(grid.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        grid.id === currentGridId
                          ? "bg-primary-600 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`w-6 h-6 flex-shrink-0 rounded flex items-center justify-center text-base ${grid.id === currentGridId ? "bg-white/20" : "bg-gray-800/80"}`}>
                          {grid.icon && grid.icon.trim() ? grid.icon.trim() : grid.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate text-sm font-medium">{grid.name}</span>
                      </div>
                      {grid.id === currentGridId && (
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                  
                  {/* Context menu */}
                  {grid.id === currentGridId && !editingGridId && (
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onIconChange && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIconPickerGridId(iconPickerGridId === grid.id ? null : grid.id);
                            }}
                            className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                            title="Change grid icon"
                          >
                            <span className="text-xs leading-none">{grid.icon && grid.icon.trim() ? grid.icon : "⊞"}</span>
                          </button>
                          {iconPickerGridId === grid.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIconPickerGridId(null)} aria-hidden />
                              <div className="absolute left-0 top-full mt-1 z-50 p-2 rounded-xl bg-gray-800 border border-gray-700 shadow-xl grid grid-cols-4 gap-1 min-w-[120px]">
                                {GRID_ICON_OPTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onIconChange(grid.id, emoji);
                                      setIconPickerGridId(null);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-gray-700 transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onIconChange(grid.id, null);
                                    setIconPickerGridId(null);
                                  }}
                                  className="col-span-4 w-full py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                >
                                  Clear icon
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareGrid(grid.id);
                        }}
                        className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Share grid"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGridId(grid.id);
                          setEditingName(grid.name);
                        }}
                        className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Rename grid"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {grids.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-3">No grids yet</p>
                <button
                  onClick={onCreateGrid}
                  className="text-primary-500 hover:text-primary-400 text-sm font-medium"
                >
                  Create your first grid
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === "channels" && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Channels
              </span>
              <div className="flex gap-1">
                {onCreateChannelGroup && (
                  <button
                    onClick={onCreateChannelGroup}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="New group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={onCreateChannel}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="New channel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {channels.length === 0 && (!channelGroups?.length && !ungroupedChannels?.length) ? (
              <div className="mt-6 px-3">
                <p className="text-xs text-gray-500 italic mb-2">
                  No channels yet
                </p>
                <button
                  onClick={onCreateChannel}
                  className="text-xs text-primary-600 hover:text-primary-500 font-medium"
                >
                  Create your first channel
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {channelGroups?.map((group) => (
                  <div key={group.id}>
                    <div className="flex items-center gap-1 group/header">
                      <button
                        onClick={() =>
                          setExpandedGroups((prev) => {
                            const next = new Set(prev);
                            if (next.has(group.id)) next.delete(group.id);
                            else next.add(group.id);
                            return next;
                          })
                        }
                        className="text-gray-400 hover:text-white p-0.5 -ml-0.5"
                      >
                        <svg
                          className={`w-3 h-3 transition-transform ${expandedGroups.has(group.id) ? "rotate-90" : ""}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="text-xs font-medium text-gray-500 uppercase truncate flex-1">
                        {group.name}
                      </span>
                      {onManageChannelGroup && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onManageChannelGroup(group.id, group.name);
                          }}
                          className="opacity-0 group-hover/header:opacity-100 p-0.5 text-gray-400 hover:text-white"
                          title="Edit group"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {expandedGroups.has(group.id) && (
                      <div className="mt-1 ml-2 space-y-1">
                        {group.channels?.map((channel) => (
                          <button
                            key={channel.id}
                            onClick={() => onChannelSelect(channel.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                              channel.id === currentChannelId
                                ? "bg-primary-600 text-white"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            <span>{channel.emoji}</span>
                            <span className="truncate flex-1 text-left">{channel.name}</span>
                            {channel.isPrivate && (
                              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {ungroupedChannels && ungroupedChannels.length > 0 && (
                  <div className="mt-2">
                    {channelGroups && channelGroups.length > 0 && (
                      <span className="text-xs font-medium text-gray-500 uppercase block mb-1">
                        Ungrouped
                      </span>
                    )}
                    <div className="space-y-1">
                      {ungroupedChannels.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => onChannelSelect(channel.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                            channel.id === currentChannelId
                              ? "bg-primary-600 text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }`}
                        >
                          <span>{channel.emoji}</span>
                          <span className="truncate flex-1 text-left">{channel.name}</span>
                          {channel.isPrivate && (
                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!channelGroups?.length && !ungroupedChannels?.length && channels.length > 0 && (
                  <div className="space-y-1">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => onChannelSelect(channel.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                          channel.id === currentChannelId
                            ? "bg-primary-600 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        <span>{channel.emoji}</span>
                        <span className="truncate flex-1 text-left">{channel.name}</span>
                        {channel.isPrivate && (
                          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === "dms" && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Direct Messages
              </span>
              {onStartDM && (
                <button
                  onClick={onStartDM}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="New DM"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-2 px-3">
              <p className="text-xs text-gray-500 italic">
                {hasGrid
                  ? "Start a new DM or add a Messages tile from the grid"
                  : "Select a grid, then add a Messages tile for encrypted DMs"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800">
        <div className="flex">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 border-r border-gray-700"
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 2.31.841 1.37 1.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.841 2.31-1.37 1.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-2.31-.841-1.37-1.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.841-2.31 1.37-1.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          )}
          <button
            onClick={onOpenThemeCustomizer}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Theme
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userEmail}</p>
              <p className="text-xs text-gray-400">Online</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
                title="Log out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
          <p className="mt-3 pt-3 border-t border-gray-800 text-[10px] text-gray-500 text-center">
            All content end-to-end encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}
