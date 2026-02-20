"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Grid } from "@/components/Grid";
import { MobileGridStack } from "@/components/grid/MobileGridStack";
import { Sidebar, GridInfo, ChannelInfo, ChannelGroupInfo } from "@/components/Sidebar";
import { ShareGridModal } from "@/components/ShareGridModal";
import { CreateGridModal } from "@/components/CreateGridModal";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { SettingsModal } from "@/components/SettingsModal";
import { Dock } from "@/components/Dock";
import { FluxPanel } from "@/components/FluxPanel";
import { CreateChannelModal } from "@/components/CreateChannelModal";
import { CreateChannelGroupModal } from "@/components/CreateChannelGroupModal";
import { ManageChannelGroupModal } from "@/components/ManageChannelGroupModal";
import { SelectConversationModal } from "@/components/SelectConversationModal";
import { ChannelView } from "@/components/ChannelView";
import { DMView } from "@/components/DMView";
import { AddMembersModal } from "@/components/AddMembersModal";
import { TileData } from "@/components/Grid";
import { ActiveGridProvider, ActiveTileProvider, useActiveTile } from "@/context/KlyrContext";
import { getTileLabel } from "@/lib/tileLabels";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

function DockWithActiveTile({
  currentGrid,
  joinedLoopRoom,
  loopBarMuted,
  onOpenFlux,
  onOpenLens,
  onOpenNotifications,
  onOpenQuickJot,
  onOpenSettings,
}: {
  currentGrid: { id: string; name: string; tiles: TileData[] };
  joinedLoopRoom: { tileId: string; roomLabel: string } | null;
  loopBarMuted: boolean;
  onOpenFlux: () => void;
  onOpenLens: () => void;
  onOpenNotifications: () => void;
  onOpenQuickJot: () => void;
  onOpenSettings: () => void;
}) {
  const { activeTileId } = useActiveTile();
  const activeTile = currentGrid.tiles.find((t) => t.id === activeTileId);
  const activeTileLabel = activeTile
    ? getTileLabel(activeTile.type, activeTile.channelName ?? activeTile.conversationName ?? activeTile.roomLabel ?? undefined)
    : undefined;
  const onFocusActiveTile = () => {
    if (activeTileId)
      window.dispatchEvent(new CustomEvent("klyr-focus-tile", { detail: { tileId: activeTileId } }));
  };
  const loopBar = joinedLoopRoom
    ? {
        tileId: joinedLoopRoom.tileId,
        roomLabel: joinedLoopRoom.roomLabel,
        muted: loopBarMuted,
        onMuteToggle: () => window.dispatchEvent(new CustomEvent("klyr-loop-mute", { detail: { tileId: joinedLoopRoom.tileId } })),
        onLeave: () => window.dispatchEvent(new CustomEvent("klyr-loop-left", { detail: { tileId: joinedLoopRoom.tileId, roomLabel: joinedLoopRoom.roomLabel } })),
        onFocus: () => window.dispatchEvent(new CustomEvent("klyr-focus-tile", { detail: { tileId: joinedLoopRoom.tileId } })),
      }
    : undefined;
  return (
    <Dock
      onOpenFlux={onOpenFlux}
      onOpenLens={onOpenLens}
      onOpenNotifications={onOpenNotifications}
      onOpenQuickJot={onOpenQuickJot}
      activeTileLabel={activeTileLabel}
      onFocusActiveTile={activeTileId ? onFocusActiveTile : undefined}
      loopBar={loopBar}
    />
  );
}

export type GridMember = { id: string; email: string; displayName: string };

interface GridWorkspaceProps {
  initialGrids: GridInfo[];
  currentGrid: {
    id: string;
    name: string;
    tiles: TileData[];
  } | null;
  userId: string;
  userEmail: string;
  userIsAdmin?: boolean;
  gridMembers?: GridMember[];
}

export function GridWorkspace({
  initialGrids,
  currentGrid,
  userId,
  userEmail,
  userIsAdmin = false,
  gridMembers = [],
}: GridWorkspaceProps) {
  const router = useRouter();
  const [grids, setGrids] = useState<GridInfo[]>(initialGrids);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [shareModalGridId, setShareModalGridId] = useState<string | null>(null);
  const [showCreateGridModal, setShowCreateGridModal] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [channelGroups, setChannelGroups] = useState<ChannelGroupInfo[]>([]);
  const [ungroupedChannels, setUngroupedChannels] = useState<ChannelInfo[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState<string>("");
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showCreateChannelGroupModal, setShowCreateChannelGroupModal] = useState(false);
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);
  const [manageGroupName, setManageGroupName] = useState("");
  const [showDMModal, setShowDMModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "channel" | "dm">("grid");
  const [selectedDMTile, setSelectedDMTile] = useState<{
    id: string;
    conversationId: string;
    conversationName: string;
    onGrid: boolean;
    gridId: string;
  } | null>(null);
  const [dmTiles, setDmTiles] = useState<{ id: string; conversationId: string | null; conversationName: string; onGrid: boolean; gridId: string }[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [fluxOpen, setFluxOpen] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [joinedLoopRoom, setJoinedLoopRoom] = useState<{ tileId: string; roomLabel: string } | null>(null);
  const [loopBarMuted, setLoopBarMuted] = useState(false);
  const joinedLoopRoomRef = useRef(joinedLoopRoom);
  joinedLoopRoomRef.current = joinedLoopRoom;
  const { isMobile } = useMediaQuery();

  useEffect(() => {
    const onJoined = (e: Event) => {
      const d = (e as CustomEvent).detail as { tileId: string; roomLabel: string };
      setJoinedLoopRoom({ tileId: d.tileId, roomLabel: d.roomLabel });
      setLoopBarMuted(false);
    };
    const onLeft = (e: Event) => {
      const d = (e as CustomEvent).detail as { tileId: string };
      setJoinedLoopRoom((prev) => (prev?.tileId === d.tileId ? null : prev));
    };
    const onMuteState = (e: Event) => {
      const d = (e as CustomEvent).detail as { tileId: string; muted: boolean };
      if (joinedLoopRoomRef.current?.tileId === d.tileId) setLoopBarMuted(d.muted);
    };
    window.addEventListener("klyr-loop-joined", onJoined);
    window.addEventListener("klyr-loop-left", onLeft);
    window.addEventListener("klyr-loop-mute-state", onMuteState);
    return () => {
      window.removeEventListener("klyr-loop-joined", onJoined);
      window.removeEventListener("klyr-loop-left", onLeft);
      window.removeEventListener("klyr-loop-mute-state", onMuteState);
    };
  }, []);

  const refreshDMs = async () => {
    try {
      const res = await fetch("/api/tiles/dms");
      if (res.ok) {
        const data = await res.json();
        setDmTiles(data.dms ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch DMs:", e);
    }
  };

  useEffect(() => {
    refreshDMs();
  }, []);

  const refreshChannels = async () => {
    try {
      const [channelsRes, groupsRes] = await Promise.all([
        fetch("/api/channels"),
        fetch("/api/channel-groups"),
      ]);
      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setChannels(
          (data.channels ?? []).map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            emoji: ch.emoji,
            isPrivate: ch.isPrivate,
          }))
        );
      }
      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        setChannelGroups(
          (gData.groups ?? []).map((g: any) => ({
            id: g.id,
            name: g.name,
            order: g.order ?? 0,
            channels: (g.channels ?? []).map((c: any) => ({
              id: c.id,
              name: c.name,
              emoji: c.emoji ?? "📢",
              isPrivate: c.isPrivate ?? false,
            })),
          }))
        );
        setUngroupedChannels(
          (gData.ungroupedChannels ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            emoji: c.emoji ?? "📢",
            isPrivate: c.isPrivate ?? false,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch channels:", error);
    }
  };

  useEffect(() => {
    refreshChannels();
  }, []);

  const toast = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleGridSelect = (gridId: string) => {
    router.push(`/grid?id=${gridId}`);
  };

  const handleCreateGrid = () => {
    setShowCreateGridModal(true);
  };

  const handleCreateGridSubmit = async (name: string) => {
    try {
      const response = await fetch("/api/grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const data = await response.json();
        setGrids((prev) => [...prev, {
          id: data.grid.id,
          name: data.grid.name,
          icon: data.grid.icon ?? null,
          createdAt: data.grid.createdAt,
        }]);
        toast("Grid created successfully");
        router.push(`/grid?id=${data.grid.id}`);
      }
    } catch (error) {
      console.error("Failed to create grid:", error);
      toast("Failed to create grid");
    }
  };

  const handleRenameGrid = async (gridId: string, newName: string) => {
    try {
      const response = await fetch(`/api/grid/${gridId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        setGrids((prev) =>
          prev.map((g) => (g.id === gridId ? { ...g, name: newName } : g))
        );
        toast("Grid renamed successfully");
      }
    } catch (error) {
      console.error("Failed to rename grid:", error);
      toast("Failed to rename grid");
    }
  };

  const handleIconChange = async (gridId: string, icon: string | null) => {
    try {
      const response = await fetch(`/api/grid/${gridId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icon }),
      });

      if (response.ok) {
        setGrids((prev) =>
          prev.map((g) => (g.id === gridId ? { ...g, icon } : g))
        );
      }
    } catch (error) {
      console.error("Failed to update grid icon:", error);
      toast("Failed to update icon");
    }
  };

  const handleShareGrid = (gridId: string) => {
    setShareModalGridId(gridId);
  };

  const handleCreateChannel = () => {
    setShowCreateChannelModal(true);
  };

  const handleCreateChannelSubmit = async (
    name: string,
    description: string,
    emoji: string,
    isPrivate: boolean
  ) => {
    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, emoji, isPrivate }),
      });

      if (response.ok) {
        const data = await response.json();
        const newChannel: ChannelInfo = {
          id: data.channel.id,
          name: data.channel.name,
          emoji: data.channel.emoji,
          isPrivate: data.channel.isPrivate,
        };
        setChannels((prev) => [...prev, newChannel]);
        setUngroupedChannels((prev) => [...prev, newChannel]);
        setCurrentChannelId(data.channel.id);
        setViewMode("channel");
        toast("Channel created successfully");
      }
    } catch (error) {
      console.error("Failed to create channel:", error);
      toast("Failed to create channel");
    }
  };

  const handleCreateChannelGroup = async (name: string) => {
    try {
      const res = await fetch("/api/channel-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        await refreshChannels();
        toast("Channel group created");
      }
    } catch (error) {
      console.error("Failed to create channel group:", error);
      toast("Failed to create channel group");
    }
  };

  const handleDMSelect = async (conversationId: string, conversationName: string) => {
    if (!currentGrid) {
      toast("Select a grid first");
      return;
    }
    try {
      const res = await fetch("/api/tiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gridId: currentGrid.id,
          type: "dm",
          conversationId,
          conversationName,
          onGrid: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowDMModal(false);
        setSelectedDMTile({
          id: data.tile.id,
          conversationId,
          conversationName,
          onGrid: false,
          gridId: currentGrid.id,
        });
        setViewMode("dm");
        refreshDMs();
        toast("DM opened in panel");
      } else {
        toast("Failed to start DM");
      }
    } catch (error) {
      console.error("Failed to start DM:", error);
      toast("Failed to start DM");
    }
  };

  const handleChannelSelect = (channelId: string) => {
    setCurrentChannelId(channelId);
    setViewMode("channel");
  };

  const handleSelectDM = (dm: { id: string; conversationId: string | null; conversationName: string; onGrid: boolean; gridId: string }) => {
    setSelectedDMTile({
      id: dm.id,
      conversationId: dm.conversationId ?? "",
      conversationName: dm.conversationName,
      onGrid: dm.onGrid,
      gridId: dm.gridId,
    });
    setViewMode("dm");
  };

  const handleDMAddToGrid = () => {
    refreshDMs();
    router.refresh();
    if (selectedDMTile) {
      setSelectedDMTile((prev) => (prev ? { ...prev, onGrid: true } : null));
    }
    toast("DM added to grid");
  };

  const handleAddMembers = async (emails: string[]) => {
    if (!currentChannelId) return;

    try {
      const response = await fetch(`/api/channels/${currentChannelId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      if (response.ok) {
        const data = await response.json();
        toast(`Added ${data.count} member(s) to channel`);
      }
    } catch (error) {
      console.error("Failed to add members:", error);
      toast("Failed to add members");
    }
  };

  if (!currentGrid && !selectedDMTile) {
    return (
      <div className="flex h-screen">
      <Sidebar
        grids={grids}
        currentGridId=""
        onGridSelect={(id) => {
          handleGridSelect(id);
          setViewMode("grid");
        }}
        onCreateGrid={handleCreateGrid}
        onRenameGrid={handleRenameGrid}
        onIconChange={handleIconChange}
        onShareGrid={handleShareGrid}
        channels={channels}
        channelGroups={channelGroups}
        ungroupedChannels={ungroupedChannels}
        currentChannelId=""
        onChannelSelect={handleChannelSelect}
        onCreateChannel={handleCreateChannel}
        onCreateChannelGroup={() => setShowCreateChannelGroupModal(true)}
        onManageChannelGroup={(id, name) => {
          setManageGroupId(id);
          setManageGroupName(name);
        }}
        onStartDM={() => toast("Select a grid first")}
        dmTiles={dmTiles}
        currentDMTileId={null}
        onSelectDM={handleSelectDM}
        hasGrid={false}
        userEmail={userEmail}
        onOpenThemeCustomizer={() => setShowThemeCustomizer(true)}
        onOpenSettings={() => setShowSettings(true)}
      />
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Grid Selected
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a new grid or select one from the sidebar
            </p>
            <button
              onClick={handleCreateGrid}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Your First Grid
            </button>
          </div>
        </div>
        {showToast && (
          <div
            className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
            role="alert"
            aria-live="polite"
          >
            {showToast}
          </div>
        )}
      </div>
    );
  }

  const sidebarWidth = isMobile ? 0 : (focusMode ? 0 : 256);
  const showSidebarInFlow = !isMobile;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop: sidebar in flow. Mobile: sidebar as overlay (rendered below when sidebarOpenMobile) */}
      {showSidebarInFlow && (
        <div
          className="flex-shrink-0 overflow-hidden transition-[width,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: sidebarWidth, minWidth: sidebarWidth, opacity: focusMode ? 0 : 1 }}
        >
          <Sidebar
            grids={grids}
            currentGridId={viewMode === "grid" && currentGrid ? currentGrid.id : ""}
            onGridSelect={(id) => {
              handleGridSelect(id);
              setViewMode("grid");
            }}
            onCreateGrid={handleCreateGrid}
            onRenameGrid={handleRenameGrid}
            onIconChange={handleIconChange}
            onShareGrid={handleShareGrid}
            channels={channels}
            channelGroups={channelGroups}
            ungroupedChannels={ungroupedChannels}
            currentChannelId={viewMode === "channel" ? currentChannelId : ""}
            onChannelSelect={handleChannelSelect}
            onCreateChannel={handleCreateChannel}
            onCreateChannelGroup={() => setShowCreateChannelGroupModal(true)}
            onManageChannelGroup={(id, name) => {
              setManageGroupId(id);
              setManageGroupName(name);
            }}
            onStartDM={() => setShowDMModal(true)}
            dmTiles={dmTiles}
            currentDMTileId={selectedDMTile?.id ?? null}
            onSelectDM={handleSelectDM}
            hasGrid={!!currentGrid}
            userEmail={userEmail}
            onOpenThemeCustomizer={() => setShowThemeCustomizer(true)}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
      )}
      {isMobile && sidebarOpenMobile && (
        <Sidebar
          grids={grids}
          currentGridId={viewMode === "grid" && currentGrid ? currentGrid.id : ""}
          onGridSelect={(id) => {
            handleGridSelect(id);
            setViewMode("grid");
          }}
          onCreateGrid={handleCreateGrid}
          onRenameGrid={handleRenameGrid}
          onShareGrid={handleShareGrid}
          channels={channels}
          channelGroups={channelGroups}
          ungroupedChannels={ungroupedChannels}
          currentChannelId={viewMode === "channel" ? currentChannelId : ""}
          onChannelSelect={handleChannelSelect}
          onCreateChannel={handleCreateChannel}
          onCreateChannelGroup={() => {
            setShowCreateChannelGroupModal(true);
            setSidebarOpenMobile(false);
          }}
          onManageChannelGroup={(id, name) => {
            setManageGroupId(id);
            setManageGroupName(name);
          }}
          onStartDM={() => setShowDMModal(true)}
          dmTiles={dmTiles}
          currentDMTileId={selectedDMTile?.id ?? null}
          onSelectDM={handleSelectDM}
          hasGrid={!!currentGrid}
          userEmail={userEmail}
          onOpenThemeCustomizer={() => setShowThemeCustomizer(true)}
          onOpenSettings={() => setShowSettings(true)}
          isOverlay
          onClose={() => setSidebarOpenMobile(false)}
        />
      )}
      {showDMModal && currentGrid && (
        <SelectConversationModal
          onClose={() => setShowDMModal(false)}
          onSelect={handleDMSelect}
        />
      )}
      {shareModalGridId && (
        <ShareGridModal
          gridId={shareModalGridId}
          gridName={grids.find((g) => g.id === shareModalGridId)?.name || "Grid"}
          onClose={() => setShareModalGridId(null)}
        />
      )}
      {showCreateGridModal && (
        <CreateGridModal
          onClose={() => setShowCreateGridModal(false)}
          onCreate={handleCreateGridSubmit}
        />
      )}
      {showThemeCustomizer && (
        <ThemeCustomizer onClose={() => setShowThemeCustomizer(false)} />
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onOpenThemeCustomizer={() => {
            setShowSettings(false);
            setShowThemeCustomizer(true);
          }}
          userIsAdmin={userIsAdmin}
        />
      )}
      {showCreateChannelModal && (
        <CreateChannelModal
          onClose={() => setShowCreateChannelModal(false)}
          onCreate={handleCreateChannelSubmit}
        />
      )}
      {showCreateChannelGroupModal && (
        <CreateChannelGroupModal
          onClose={() => setShowCreateChannelGroupModal(false)}
          onCreate={handleCreateChannelGroup}
        />
      )}
      {manageGroupId && manageGroupName && (
        <ManageChannelGroupModal
          groupId={manageGroupId}
          groupName={manageGroupName}
          onClose={() => {
            setManageGroupId(null);
            setManageGroupName("");
          }}
          onUpdate={refreshChannels}
        />
      )}
      {showAddMembersModal && currentChannelId && (
        <AddMembersModal
          channelName={channels.find((c) => c.id === currentChannelId)?.name || "Channel"}
          onClose={() => setShowAddMembersModal(false)}
          onAdd={handleAddMembers}
        />
      )}
      {viewMode === "grid" && currentGrid ? (
        <ActiveGridProvider
          gridId={currentGrid.id}
          gridName={currentGrid.name}
        >
          <ActiveTileProvider
            gridId={currentGrid.id}
            tileIds={currentGrid.tiles.map((t) => t.id)}
            tileLabels={Object.fromEntries(
              currentGrid.tiles.map((t) => [
                t.id,
                getTileLabel(t.type, t.channelName ?? t.conversationName ?? undefined),
              ])
            )}
          >
            {isMobile ? (
              <MobileGridStack
                initialTiles={currentGrid.tiles}
                userId={userId}
                gridId={currentGrid.id}
                gridName={currentGrid.name}
                userEmail={userEmail}
                grids={grids}
                gridMembers={gridMembers}
                onGridSelect={(id) => {
                  handleGridSelect(id);
                  setViewMode("grid");
                }}
                onShare={() => setShareModalGridId(currentGrid.id)}
                onOpenSidebar={() => setSidebarOpenMobile(true)}
              />
            ) : (
              <Grid
                initialTiles={currentGrid.tiles}
                userId={userId}
                gridId={currentGrid.id}
                gridName={currentGrid.name}
                userEmail={userEmail}
                grids={grids}
                gridMembers={gridMembers}
                onGridSelect={(id) => {
                  handleGridSelect(id);
                  setViewMode("grid");
                }}
                onShare={() => setShareModalGridId(currentGrid.id)}
                focusMode={focusMode}
                onFocusModeChange={setFocusMode}
                onOpenSidebar={undefined}
              />
            )}
            <DockWithActiveTile
              currentGrid={currentGrid}
              joinedLoopRoom={joinedLoopRoom}
              loopBarMuted={loopBarMuted}
              onOpenFlux={() => setFluxOpen(true)}
              onOpenLens={() => {}}
              onOpenNotifications={() => {}}
              onOpenQuickJot={() => {}}
              onOpenSettings={() => setShowSettings(true)}
            />
            {fluxOpen && (
              <FluxPanel
                gridId={currentGrid.id}
                gridName={currentGrid.name}
                onClose={() => setFluxOpen(false)}
                onOpenSettings={() => {
                  setFluxOpen(false);
                  setShowSettings(true);
                }}
              />
            )}
          </ActiveTileProvider>
        </ActiveGridProvider>
      ) : viewMode === "dm" && selectedDMTile ? (
        <DMView
          tileId={selectedDMTile.id}
          conversationId={selectedDMTile.conversationId}
          conversationName={selectedDMTile.conversationName}
          onGrid={selectedDMTile.onGrid}
          gridId={selectedDMTile.gridId}
          onAddToGrid={handleDMAddToGrid}
          userEmail={userEmail}
        />
      ) : viewMode === "grid" && !currentGrid ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">Select a grid from the sidebar</p>
        </div>
      ) : currentChannelId ? (
        <ChannelView
          channelId={currentChannelId}
          channelName={channels.find((c) => c.id === currentChannelId)?.name || "Channel"}
          channelEmoji={channels.find((c) => c.id === currentChannelId)?.emoji || "📢"}
          onAddMembers={() => setShowAddMembersModal(true)}
          userEmail={userEmail}
        />
      ) : null}
      {showToast && (
        <div
          className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          role="alert"
          aria-live="polite"
        >
          {showToast}
        </div>
      )}
    </div>
  );
}
