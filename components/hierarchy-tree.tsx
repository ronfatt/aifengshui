"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Crown,
  Link2,
  Network,
  Search,
  Share2,
  UserRound,
  UsersRound
} from "lucide-react";
import { downlineSummary, downlineTree, type DownlineMember } from "@/lib/data";

const levelLabels = {
  0: "本人",
  1: "第一代",
  2: "第二代",
  3: "第三代"
};

const levelCommission = {
  0: "团队总览",
  1: "20%",
  2: "10%",
  3: "5%"
};

function flattenTree(member: DownlineMember): DownlineMember[] {
  return [member, ...(member.children || []).flatMap(flattenTree)];
}

function statusClass(status: DownlineMember["status"]) {
  if (status === "活跃") {
    return "bg-gold/15 text-ink";
  }

  if (status === "跟进中") {
    return "bg-gold/15 text-ink";
  }

  return "bg-black/5 text-ink/55";
}

function levelClass(level: DownlineMember["level"]) {
  if (level === "Master") {
    return "border-[#B91C1C]/30 bg-[#B91C1C]/10 text-[#B91C1C]";
  }

  if (level === "Pro") {
    return "border-ink/15 bg-cloud text-ink";
  }

  if (level === "Plus") {
    return "border-gold/35 bg-gold/15 text-ink";
  }

  return "border-black/10 bg-cloud text-ink/58";
}

function MemberNode({
  member,
  selectedId,
  expandedIds,
  onSelect,
  onToggle
}: {
  member: DownlineMember;
  selectedId: string;
  expandedIds: Set<string>;
  onSelect: (member: DownlineMember) => void;
  onToggle: (id: string) => void;
}) {
  const hasChildren = Boolean(member.children?.length);
  const isExpanded = expandedIds.has(member.id);
  const isSelected = selectedId === member.id;

  return (
    <li>
      <div className="flex items-stretch gap-2">
        <div className="flex w-5 justify-center">
          {member.relationLevel > 0 ? <span className="h-full w-px bg-black/10" /> : null}
        </div>
        <button
          type="button"
          onClick={() => onSelect(member)}
          className={`min-w-0 flex-1 rounded border p-3 text-left transition ${
            isSelected ? "border-[#D4AF37] bg-cloud shadow-sm" : "border-black/10 bg-white hover:bg-cloud"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded bg-cloud text-ink">
              {member.relationLevel === 0 ? <Crown className="size-4 text-gold" /> : <UserRound className="size-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{member.name}</span>
              <span className="mt-0.5 block truncate text-xs text-ink/52">{member.code}</span>
            </span>
            <span className={`shrink-0 rounded border px-2 py-1 text-xs font-medium ${levelClass(member.level)}`}>
              {member.level}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <span className="rounded bg-cloud px-2 py-1 text-ink/62">{levelLabels[member.relationLevel]}</span>
            <span className="rounded bg-cloud px-2 py-1 text-ink/62">佣金 {levelCommission[member.relationLevel]}</span>
            <span className={`rounded px-2 py-1 text-center font-medium ${statusClass(member.status)}`}>
              {member.status}
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => hasChildren && onToggle(member.id)}
          className="grid w-10 shrink-0 place-items-center rounded border border-black/10 bg-white text-ink/60 disabled:opacity-30"
          disabled={!hasChildren}
          aria-label={isExpanded ? "收起下线" : "展开下线"}
        >
          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>
      {hasChildren && isExpanded ? (
        <ul className="ml-5 mt-2 space-y-2 border-l border-black/10 pl-3">
          {member.children?.map((child) => (
            <MemberNode
              key={child.id}
              member={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function HierarchyTree() {
  const allMembers = useMemo(() => flattenTree(downlineTree), []);
  const [selectedMember, setSelectedMember] = useState<DownlineMember>(downlineTree);
  const [expandedIds, setExpandedIds] = useState(() => new Set(["u-root", "u-101", "u-102"]));
  const [query, setQuery] = useState("");

  const filteredMembers = allMembers.filter((member) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return member.relationLevel > 0;
    }

    return `${member.name} ${member.code} ${member.level} ${member.status}`.toLowerCase().includes(keyword);
  });

  function handleToggle(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section className="mt-6 rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="size-5 text-[#064E3B]" />
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#064E3B]">Hierarchy Tree</p>
          </div>
          <h2 className="mt-2 text-2xl font-semibold">我的下线团队</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
            查看三层推荐关系、会员等级、销售额、点数和预估佣金。MVP 先展示三层，后台可继续扩展为团队业绩看板。
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-semibold">
            <Copy className="size-4" /> 推荐码
          </button>
          <button className="flex items-center gap-2 rounded bg-[#064E3B] px-3 py-2 text-sm font-semibold text-white">
            <Share2 className="size-4" /> 分享
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {downlineSummary.map((item) => (
          <div key={item.label} className="rounded border border-black/10 bg-rice p-4">
            <p className="text-sm text-ink/55">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            <p className="mt-1 text-xs text-[#064E3B]">{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded border border-black/10 bg-rice p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">团队层级树</h3>
              <p className="mt-1 text-xs text-ink/52">点击成员查看明细，箭头可展开/收起下线。</p>
            </div>
            <span className="rounded bg-white px-2.5 py-1 text-xs font-medium text-ink/58">三层分润</span>
          </div>
          <ul className="space-y-2">
            <MemberNode
              member={downlineTree}
              selectedId={selectedMember.id}
              expandedIds={expandedIds}
              onSelect={setSelectedMember}
              onToggle={handleToggle}
            />
          </ul>
        </div>

        <div className="grid gap-4">
          <div className="rounded border border-black/10 bg-[#102019] p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/55">当前查看</p>
                <h3 className="mt-1 text-2xl font-semibold">{selectedMember.name}</h3>
                <p className="mt-1 text-sm text-white/58">{selectedMember.code}</p>
              </div>
              <span className="rounded bg-white/10 px-3 py-1 text-sm">{levelLabels[selectedMember.relationLevel]}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["会员等级", selectedMember.level],
                ["状态", selectedMember.status],
                ["加入日期", selectedMember.joinedAt],
                ["点数余额", selectedMember.points],
                ["团队销售", selectedMember.sales],
                ["预估佣金", selectedMember.commission]
              ].map(([label, value]) => (
                <div key={label} className="rounded border border-white/12 bg-white/8 p-3">
                  <p className="text-xs text-white/48">{label}</p>
                  <p className="mt-1 font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-black/10 bg-white p-4">
            <div className="flex items-center gap-2 rounded border border-black/10 bg-rice px-3 py-2">
              <Search className="size-4 shrink-0 text-ink/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="搜索姓名、推荐码、等级或状态"
              />
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto scrollbar-soft">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="flex w-full items-center justify-between gap-3 border-t border-black/10 py-3 text-left first:border-t-0"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded bg-cloud">
                      <UsersRound className="size-4 text-ink/60" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{member.name}</span>
                      <span className="block truncate text-xs text-ink/52">
                        {levelLabels[member.relationLevel]} · {member.code}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[#064E3B]">{member.commission}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded border border-black/10 px-3 py-3 text-sm font-semibold">
              <Link2 className="size-4" /> 复制链接
            </button>
            <button className="flex items-center justify-center gap-2 rounded border border-black/10 px-3 py-3 text-sm font-semibold">
              <Share2 className="size-4" /> 生成海报
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
