const app: HTMLDivElement = document.querySelector("#app")!;

const testbutton: HTMLButtonElement = document.createElement("button");
testbutton.innerHTML = "Click Here!";
testbutton.onclick = function () {
    alert("You did it!");
};

app.append(testbutton);
