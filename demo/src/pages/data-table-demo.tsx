import { DataTable, Pager, Panel, SectionHeader, StatusBadge } from '@pstrikez/fluent-winui-theme';
import type { DataTableColumn } from '@pstrikez/fluent-winui-theme';
import { useState } from 'react';

interface Member { id: string; name: string; role: string; requests: number; status: 'Active' | 'Paused' }

const ROLES = ['Owner', 'Admin', 'Editor', 'Viewer'];
const NAMES = ['Aiko', 'Ben', 'Chen', 'Dara', 'Eli', 'Farah', 'Gus', 'Hana', 'Ivo', 'Jun', 'Kai', 'Lena', 'Mio', 'Noor', 'Omar', 'Pia', 'Quinn', 'Ravi', 'Sana', 'Tomas', 'Uma', 'Vik', 'Wen', 'Xia', 'Yuri', 'Zoe'];
const MEMBERS: Member[] = NAMES.map((name, index) => ({
  id: `m${index}`,
  name,
  requests: ((index * 7919) % 4000) + 120,
  role: ROLES[index % ROLES.length]!,
  status: index % 5 === 3 ? 'Paused' : 'Active',
}));

const columns: DataTableColumn<Member>[] = [
  { key: 'name', title: 'Name', dataKey: 'name', sort: (a, b) => a.name.localeCompare(b.name), width: '200px' },
  { key: 'role', title: 'Role', dataKey: 'role', sort: (a, b) => a.role.localeCompare(b.role), width: '140px' },
  { key: 'status', title: 'Status', render: row => <StatusBadge tone={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</StatusBadge> },
  { key: 'requests', title: 'Requests', align: 'end', render: row => row.requests.toLocaleString(), sort: (a, b) => a.requests - b.requests, width: '140px' },
];

export function DataTableDemo() {
  const [selected, setSelected] = useState<string[]>(['m1']);
  const [page, setPage] = useState(8);
  const [pageSize, setPageSize] = useState(10);
  return <>
    <section className="grid gap-2">
      <SectionHeader level={3} title="Data table" />
      <Panel padding="flush">
        <DataTable
          ariaLabel="Members"
          columns={columns}
          expandable={{ isExpandable: row => row.status === 'Active', render: row => `${row.name} has used ${row.requests.toLocaleString()} requests this month.` }}
          minWidth={560}
          pagination={{ pageSize: 5, pageSizeOptions: [5, 10, 20], showTotal: true }}
          rowKey={row => row.id}
          rows={MEMBERS}
          selection={{ isSelectable: row => row.role !== 'Owner', onChange: setSelected, selectedKeys: selected }}
        />
      </Panel>
    </section>
    <section className="grid gap-2">
      <SectionHeader level={3} title="Pager" />
      <Panel>
        <Pager onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} showTotal total={420} />
      </Panel>
    </section>
  </>;
}
