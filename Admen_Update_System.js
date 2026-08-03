const version = "1";
UPDATE=false
function Start_UPDATE(){
    BackUp()
    UpdateScreen.style.display="flex"
    setTimeout(function(){
        UpdateScreen.style.display="none"
        Adminepass.style.display="flex"
    }, 5000);
}
async function SendTelegramFile(chatId, file, caption = "") {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", caption);
    formData.append("document", file);
    const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
        {
            method: "POST",
            body: formData
        }
    );
    return await response.json();
}
function GetBackupFileName(){
    const now = new Date();
    const pad = n => String(n).padStart(2,"0");
    const year = now.getFullYear();
    const month = pad(now.getMonth()+1);
    const day = pad(now.getDate());
    const hour = pad(now.getHours());
    const minute = pad(now.getMinutes());
    const second = pad(now.getSeconds());
    return `Backup_V${version}_DATE(${year}-${month}-${day}_${hour}-${minute}-${second}).json`;
}
function ReadDB(dbName){
    return new Promise((resolve,reject)=>{
        DB[dbName]
            .ref("/")
            .once("value")
            .then(snapshot=>{
                let data = snapshot.val();
                if(data==null){
                    data={
                        Students:{},
                        StudentsInJee_Pointer:0,
                        free_IDS:[-1],
                    };
                }
                resolve(data);
            })
            .catch(reject);
    });
}
function ReadMain(){
    return new Promise((resolve,reject)=>{
        JeeMain.ref("/")
            .once("value")
            .then(snapshot=>resolve(snapshot.val()))
            .catch(reject);
    });
}
window.addEventListener("offline", () => {
    openPage(-1);
    ErrorText.innerHTML = `
        <h2>📡 انقطع الاتصال بالإنترنت</h2>
        <p>
            يرجى التأكد من اتصالك بالشبكة ثم أعد المحاولة.
        </p>
    `;
    ERRORPAGE.style.display = "flex";
});
window.addEventListener("online", () => {
    if (ERRORPAGE.style.display == "flex") {
        location.reload();
    }
});
async function BackUp(){
    try{
        let UpdateSystem={
            version:version,
            Date:new Date().toISOString(),
            Database:{}
        };
        for(const Jee in configs){
            UpdateSystem.Database[Jee]=await ReadDB(Jee);
        }
        UpdateSystem.Database.JeeMain=await ReadMain();
        const json =
            JSON.stringify(UpdateSystem,null,4);
        const file = new File(
            [json],
            GetBackupFileName(),
            {
                type:"application/json"
            }
        );
        const result=
            await SendTelegramFile(
                "5735394288",
                file,
                "Database Backup"
            );
        console.log(result);
    }
    catch(error){
        await SendTelegramNotification(
            "5735394288",
        `❌ Backup Error
        ${error.message}
        ${error.stack}`
        );
        ShowError(error);
    }
}
function ShowError(error){
    ErrorText.textContent =
        error?.message || error || "حدث خطأ غير معروف.";
    openPage(-1);
    ERRORPAGE.style.display = "flex";
}
function Restore_Backup(backup){
    if(backup.version !== version){
        alert("إصدار النسخة الاحتياطية غير مدعوم.");
        return;
    }
    for(const db in backup.Database){
        if(db === "JeeMain"){
            SODOwrite(backup.Database[db]);
        }else{
            write(db, backup.Database[db]);
        }
    }
    alert("تم استعادة النسخة الاحتياطية بنجاح.");
}
