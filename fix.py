c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
c=c.replace("  const [editModal, setEditModal] = useState<any>(null);\n  const [editForm, setEditForm] = useState<any>({});\n  const [savingEdit, setSavingEdit] = useState(false);\n  const [editModal, setEditModal] = useState<any>(null);\n  const [editForm, setEditForm] = useState<any>({});\n  const [savingEdit, setSavingEdit] = useState(false);","  const [editModal, setEditModal] = useState<any>(null);\n  const [editForm, setEditForm] = useState<any>({});\n  const [savingEdit, setSavingEdit] = useState(false);",1)
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
print("Done")
