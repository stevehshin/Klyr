"use client";

export interface UserAvatarProps {
  user: {
    id?: string;
    email?: string;
    displayName?: string | null;
    avatarData?: string | null;
  };
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

function displayName(user: UserAvatarProps["user"]): string {
  if (user.displayName?.trim()) return user.displayName.trim();
  if (user.email) return user.email.split("@")[0] ?? user.email;
  return "?";
}

function initial(user: UserAvatarProps["user"]): string {
  const name = displayName(user);
  return name.charAt(0).toUpperCase();
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

export function UserAvatar({ user, size = "md", showName = false, className = "" }: UserAvatarProps) {
  const sizeClass = sizeClasses[size];
  const name = displayName(user);
  const initialChar = initial(user);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 overflow-hidden bg-primary-600 ${sizeClass}`}
        title={name}
      >
        {user.avatarData ? (
          <img
            src={user.avatarData}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          initialChar
        )}
      </div>
      {showName && (
        <span className="font-semibold text-gray-900 dark:text-white truncate text-sm">
          {name}
        </span>
      )}
    </div>
  );
}
