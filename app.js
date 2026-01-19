const taskInput = document.getElementById("taskInput")
const taskList = document.getElementById("taskList")

let tasks = JSON.parse(localStorage.getItem("tasks")) || []

function renderTasks(){
  taskList.innerHTML=""
  tasks.forEach((t,i)=>{
    const li=document.createElement("li")
    li.textContent=t
    li.onclick=()=>removeTask(i)
    taskList.appendChild(li)
  })
}

function addTask(){
  if(taskInput.value==="")return
  tasks.push(taskInput.value)
  taskInput.value=""
  save()
}

function removeTask(i){
  tasks.splice(i,1)
  save()
}

function save(){
  localStorage.setItem("tasks",JSON.stringify(tasks))
  renderTasks()
}

function toggleTheme(){
  document.body.classList.toggle("dark")
  document.body.classList.toggle("light")
}

function changeWallpaper(src){
  document.body.style.backgroundImage=src?`url(${src})`:""
}

function customWallpaper(e){
  const f=e.target.files[0]
  if(!f)return
  const r=new FileReader()
  r.onload=()=>document.body.style.backgroundImage=`url(${r.result})`
  r.readAsDataURL(f)
}

renderTasks()
