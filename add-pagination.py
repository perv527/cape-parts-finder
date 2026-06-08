path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add pagination state
old_state = '  const [reminderDueCount, setReminderDueCount] = useState(0);'
new_state = '''  const [reminderDueCount, setReminderDueCount] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;'''
c = c.replace(old_state, new_state, 1)

# 2. Add pagination controls after the request cards list
old_end = '          </div>\n        </div>\n      </div>\n\n      {/* REMINDER MODAL */'
new_end = '''          </div>

          {/* PAGINATION */}
          {filteredRequests.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3 mt-4 pb-4">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-4 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: page === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}>
                ← Previous
              </button>
              <span className="text-[12px] text-gray-500">
                Page {page + 1} of {Math.ceil(filteredRequests.length / PAGE_SIZE)} · {filteredRequests.length} total
              </span>
              <button onClick={() => setPage(p => Math.min(Math.ceil(filteredRequests.length / PAGE_SIZE) - 1, p + 1))}
                disabled={page >= Math.ceil(filteredRequests.length / PAGE_SIZE) - 1}
                className="px-4 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: page >= Math.ceil(filteredRequests.length / PAGE_SIZE) - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}>
                Next →
              </button>
            </div>
          )}

        </div>
      </div>

      {/* REMINDER MODAL */'''
c = c.replace(old_end, new_end, 1)

# 3. Slice the filteredRequests for display
old_map = '{filteredRequests.map((request) => {'
new_map = '{filteredRequests.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((request) => {'
c = c.replace(old_map, new_map, 1)

# 4. Reset page when filter changes
old_filter = '  const filteredRequests = requests.filter((r) => {'
new_filter = '''  // Reset page when search or filter changes
  useEffect(() => { setPage(0); }, [search, statusFilter]);

  const filteredRequests = requests.filter((r) => {'''
c = c.replace(old_filter, new_filter, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has PAGE_SIZE:", "PAGE_SIZE" in c)
print("has pagination:", "Previous" in c)
print("has slice:", "slice(page" in c)
