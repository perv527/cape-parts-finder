path = "frontend/app/page.tsx"
c = open(path, encoding="utf-8").read()

# Add compress function before handleSubmit
old_submit = '  async function handleSubmit() {'
new_submit = '''  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 1200;
          let w = img.width;
          let h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressed = new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() });
              resolve(compressed);
            } else {
              resolve(file);
            }
          }, "image/jpeg", 0.75);
        };
      };
    });
  }

  async function handleSubmit() {'''
c = c.replace(old_submit, new_submit, 1)

# Use compression in upload loop
old_upload = '      for (const photo of photos) {'
new_upload = '''      for (const rawPhoto of photos) {
        const photo = await compressImage(rawPhoto);'''
c = c.replace(old_upload, new_upload, 1)

# Fix the closing of the loop
old_loop_end = '        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${photo.name}`;'
new_loop_end = '        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;'
c = c.replace(old_loop_end, new_loop_end, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has compressImage:", "compressImage" in c)
print("has canvas:", "canvas" in c)
print("has 0.75 quality:", "0.75" in c)
