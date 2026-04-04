import React, { useState } from "react"
function To_Do_List() {

    const [tasks, setTasks] = useState([])
    const [inputtask, setInputtask] = useState("");

    function newtask(event) {
        setInputtask(event.target.value);
    }

    function addtask() {
        if (inputtask.trim() !== "") {
            setTasks(t => [...t, { id: Date.now(), text: inputtask, done: false }]);
        }
        setInputtask("");
    }

    function deletetask(id) {
        setTasks(tasks.filter((task) => task.id !== id));
    }

    function toggleDone(id) {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, done: !task.done } : task
        ));
    }

    function clearTasks() {
        setTasks([]);
    }

    function moveup(index) {
        if (index > 0) {
            const temp = [...tasks];
            [temp[index], temp[index - 1]] = [temp[index - 1], temp[index]];
            setTasks(temp);
        }
    }

    function movedown(index) {
        if (index < tasks.length - 1) {
            const temp = [...tasks];
            [temp[index], temp[index + 1]] = [temp[index + 1], temp[index]];
            setTasks(temp);
        }
    }

    const remainingTasks = tasks.filter(t => !t.done).length;

    return (<div className="tdl">
        <h2 className="tdl-heading">TO DO LIST</h2>
        <p className="tdl-counter">{remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'} remaining</p>

        <div className="tdl-input-container">
            <input
                className="tdl-input"
                type="text"
                placeholder="Enter a task..."
                value={inputtask}
                onChange={newtask}
                onKeyDown={(e) => e.key === 'Enter' && addtask()} />
            <button
                className="tdl-add-button"
                onClick={addtask}
                aria-label="Add task">
                ADD
            </button>
        </div>

        <ul>
            {tasks.length === 0 ? (
                <p className="tdl-empty-message">Nothing here yet — add a task above ✓</p>
            ) : (
                tasks.map((task, index) => (
                    <li key={task.id}
                        className="tdl-task">
                        <button
                            className="tdl-delete-button"
                            onClick={() => deletetask(task.id)}
                            aria-label="Delete task">DELETE</button>
                        <span
                            className={`text ${task.done ? 'completed' : ''}`}
                            onClick={() => toggleDone(task.id)}
                            title="Click to toggle completion">
                            {task.text}
                        </span>
                        <div className="tdl-arrows">
                            <button
                                className="tdl-up-button"
                                onClick={() => moveup(index)}
                                aria-label="Move task up">↑</button>
                            <button
                                className="tdl-down-button"
                                onClick={() => movedown(index)}
                                aria-label="Move task down">↓</button>
                        </div>
                    </li>
                ))
            )}
        </ul>

        {tasks.length > 0 && (
            <button
                className="tdl-clear-button"
                onClick={clearTasks}>
                Clear All
            </button>
        )}
    </div>);

}
export default To_Do_List;