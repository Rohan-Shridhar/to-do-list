import React, {useState} from "react"
function To_Do_List() {

    const [tasks,setTasks] = useState([])
    const [inputtask,setInputtask] = useState("");

    function newtask(event){
        setInputtask(event.target.value);
    }

    function addtask(){
        if(inputtask.trim() !== ""){
            setTasks(t => [...t,inputtask]);
        }
        setInputtask("");
    }

    function deletetask(index){
        setTasks(tasks.filter((_,i) => i !== index));
    }

    function moveup(index){
        if(index > 0){
            const temp = [...tasks];
            [temp[index],temp[index-1]] = [temp[index-1],temp[index]];
            setTasks(temp);
        }
    }

    function movedown(index){
        if(index < tasks.length - 1){
            const temp = [...tasks];
            [temp[index],temp[index+1]] = [temp[index+1],temp[index]];
            setTasks(temp);
        }
    }

    return(<div className="tdl">
        <h2 className="tdl-heading" style={{fontFamily:"comic sans ms"}}>TO DO LIST</h2>
        <input 
        className="tdl-input"
        type="text"
        placeholder="Enter a task..."
        value={inputtask}
        onChange={newtask}/>
        <button 
        className="tdl-add-button"
        onClick={addtask} >
            ADD
        </button>
        <ul
        style={{paddingLeft:"0px"}}>
            {tasks.map((task, index) => (
            <li key={index}
            className="tdl-task">
            <span className="text">{task}</span>
            <button
            className="tdl-delete-button"
            onClick={() => deletetask(index)}>DELETE</button>
            <button
            className="tdl-up-button"
            onClick={() => moveup(index)}>👆</button>
            <button
            className="tdl-down-button"
            onClick={() => movedown(index)}>👇</button>
            </li>
            ))}
        </ul>
    </div>);
}
export default To_Do_List;