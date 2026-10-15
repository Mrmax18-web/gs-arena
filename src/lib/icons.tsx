import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * 12-spoke geometric starburst logo (REFERENCE-A top brand icon).
 */
export function StarburstLogo({ size = 28, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
        <line
          key={i}
          x1="16"
          y1="5"
          x2="16"
          y2="9.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
    </svg>
  );
}

/**
 * Solar: ranking / cup-star bold duotone icon.
 */
export function IconRanking({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        opacity="0.35"
        d="M3 13.5V18.5C3 19.8807 4.11929 21 5.5 21H8.5V13.5H3Z"
        fill="currentColor"
      />
      <path
        opacity="0.35"
        d="M15.5 9.5V21H18.5C19.8807 21 21 19.8807 21 18.5V9.5H15.5Z"
        fill="currentColor"
      />
      <path
        d="M8.5 4.5C8.5 3.67157 9.17157 3 10 3H14C14.8284 3 15.5 3.67157 15.5 4.5V21H8.5V4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Solar: chart-2 bold duotone icon.
 */
export function IconChart({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        opacity="0.35"
        d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
        fill="currentColor"
      />
      <path
        d="M7 16.5V14M12 16.5V10.5M17 16.5V7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Solar: document-text bold duotone icon.
 */
export function IconDocument({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        opacity="0.35"
        d="M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z"
        fill="currentColor"
      />
      <path
        d="M8 8H16M8 12H16M8 16H12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Solar: question-circle bold duotone icon.
 */
export function IconHelp({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle opacity="0.35" cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M10 9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9C14 9.87851 13.4326 10.6241 12.6416 10.8872C12.1865 11.0385 11.875 11.4651 11.875 11.9444V12.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Solar: user-plus bold duotone icon.
 */
export function IconUserPlus({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle opacity="0.35" cx="10" cy="7" r="4" fill="currentColor" />
      <path
        opacity="0.35"
        d="M2 18C2 15.2386 5.58172 13 10 13C14.4183 13 18 15.2386 18 18V19C18 19.5523 17.5523 20 17 20H3C2.44772 20 2 19.5523 2 19V18Z"
        fill="currentColor"
      />
      <path
        d="M19 8V14M16 11H22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Solar: check-read bold duotone icon.
 */
export function IconApprovals({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <rect opacity="0.35" x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
      <path
        d="M8 12.5L10.5 15L16 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Solar: gamepad bold duotone icon (substituted for swords).
 */
export function IconMatches({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        opacity="0.35"
        d="M4.5 9C4.5 7.34315 5.84315 6 7.5 6H16.5C18.1569 6 19.5 7.34315 19.5 9V15C19.5 16.6569 18.1569 18 16.5 18H7.5C5.84315 18 4.5 16.6569 4.5 15V9Z"
        fill="currentColor"
      />
      <path d="M8 12H11M9.5 10.5V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
      <circle cx="16.5" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Solar: list-cross / standings bold duotone icon.
 */
export function IconStandings({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <rect opacity="0.35" x="3" y="4" width="18" height="16" rx="4" fill="currentColor" />
      <path d="M7 8H17M7 12H17M7 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Solar: diagram-up / bracket bold duotone icon.
 */
export function IconBracket({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M4 6H10V11H14V8H20M4 18H10V13H14V16H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

/**
 * Solar: users-group-two-rounded bold duotone icon.
 */
export function IconGroups({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle opacity="0.35" cx="9" cy="7" r="3.5" fill="currentColor" />
      <circle opacity="0.35" cx="16" cy="9" r="2.5" fill="currentColor" />
      <path
        opacity="0.35"
        d="M2 18C2 15.5 5 14 9 14C13 14 16 15.5 16 18V19H2V18Z"
        fill="currentColor"
      />
      <path
        d="M16 14C17.5 14.5 19 15.5 19 17.5V19H22V17.5C22 15 19 14 16 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Solar: history / activity bold duotone icon.
 */
export function IconActivity({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle opacity="0.35" cx="12" cy="12" r="9" fill="currentColor" />
      <path d="M12 7V12L15.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Solar: settings bold duotone icon.
 */
export function IconSettings({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle opacity="0.35" cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/**
 * Solar: lightbulb-bolt bold duotone icon (Creator Console item).
 */
export function IconCreatorBulb({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        opacity="0.35"
        d="M12 2C7.58172 2 4 5.58172 4 10C4 12.5 5.5 14.5 7 16V18C7 18.5523 7.44772 19 8 19H16C16.5523 19 17 18.5523 17 18V16C18.5 14.5 20 12.5 20 10C20 5.58172 16.4183 2 12 2Z"
        fill="currentColor"
      />
      <path
        d="M12.5 6L9.5 11H13.5L11.5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Solar: logout-2 linear icon.
 */
export function IconLogout({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M14 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 8L14 12L10 16M14 12H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Hand-drawn curved arrow SVG for Reference-B discount/note annotations ("save 25%" style).
 */
export function AnnotationCurvedArrow({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="18"
      viewBox="0 0 24 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 15C5 6 12 2 20 3M20 3L16 1M20 3L17 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
