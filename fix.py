c=open("frontend/app/page.tsx",encoding="utf-8").read()
old="      window.open(waUrl, \"_blank\");\n\n    } catch (err)"
new="      window.open(waUrl, \"_blank\");\n\n      // Admin notification email\n      fetch(\"/api/send-email\", { method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify({ type: \"admin_notification\", to: \"admin@capepartsfinder.co.za\", customerName: sanitized.customer_name, partNeeded: sanitized.part_needed, vehicle: (sanitized.vehicle_year + \" \" + sanitized.vehicle_make + \" \" + sanitized.vehicle_model).trim(), phone: sanitized.phone_number }) }).catch(() => {});\n\n    } catch (err)"
c=c.replace(old,new,1)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "admin@capepartsfinder" in c)
