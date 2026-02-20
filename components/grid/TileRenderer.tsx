"use client";

import { NotesTile } from "@/components/NotesTile";
import { DMTile } from "@/components/DMTile";
import { TasksTile } from "@/components/TasksTile";
import { LinksTile } from "@/components/LinksTile";
import { CalendarTile } from "@/components/CalendarTile";
import { ChannelTile } from "@/components/ChannelTile";
import { CallTile } from "@/components/CallTile";
import { SummaryTile } from "@/components/SummaryTile";
import { LoopRoomTile } from "@/components/LoopRoomTile";
import type { TileData } from "@/components/Grid";
import type { GridMember } from "@/components/Grid";

export interface TileRendererProps {
  tile: TileData;
  gridId: string;
  userId: string;
  userEmail?: string;
  gridMembers?: GridMember[];
  onClose: (tileId: string) => void;
}

export function TileRenderer({ tile, gridId, userId, userEmail, gridMembers = [], onClose }: TileRendererProps) {
  if (tile.type === "notes")
    return <NotesTile tileId={tile.id} onClose={() => onClose(tile.id)} />;
  if (tile.type === "dm")
    return (
      <DMTile
        tileId={tile.id}
        conversationId={tile.conversationId || ""}
        conversationName={tile.conversationName || "DM"}
        userEmail={userEmail}
        onClose={() => onClose(tile.id)}
      />
    );
  if (tile.type === "channel")
    return (
      <ChannelTile
        tileId={tile.id}
        channelId={tile.channelId || ""}
        channelName={tile.channelName || "Channel"}
        channelEmoji={tile.channelEmoji || "📢"}
        onClose={() => onClose(tile.id)}
      />
    );
  if (tile.type === "call")
    return (
      <CallTile
        tileId={tile.id}
        roomId={tile.roomId || tile.channelId || tile.conversationId || gridId}
        roomLabel={tile.roomLabel || "Call"}
        userEmail={userEmail}
        onClose={() => onClose(tile.id)}
      />
    );
  if (tile.type === "summary")
    return (
      <SummaryTile
        tileId={tile.id}
        gridId={gridId}
        onClose={() => onClose(tile.id)}
      />
    );
  if (tile.type === "tasks")
    return (
      <TasksTile
        tileId={tile.id}
        gridId={gridId}
        userId={userId}
        userEmail={userEmail ?? ""}
        gridMembers={gridMembers}
        onClose={() => onClose(tile.id)}
      />
    );
  if (tile.type === "loop_room")
    return (
      <LoopRoomTile
        tileId={tile.id}
        roomLabel={tile.roomLabel ?? "Loop room"}
        userEmail={userEmail ?? undefined}
        onClose={() => onClose(tile.id)}
      />
    );
  if (tile.type === "links")
    return <LinksTile tileId={tile.id} onClose={() => onClose(tile.id)} />;
  if (tile.type === "calendar")
    return <CalendarTile tileId={tile.id} gridId={gridId} onClose={() => onClose(tile.id)} />;
  return null;
}
