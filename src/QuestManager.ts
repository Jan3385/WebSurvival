class Quest{
    public constructor(questID:number, questRequirement: string, numberOfSteps: number){
        this.questID = questID;
        this.questRequirement = questRequirement;
        this.questRequirementStepsMax = numberOfSteps;
    }
    questID:number;
    questRequirement: string;
    questRequirementStep: number = 0;
    questRequirementStepsMax: number;

    public static GetQuests(): Quest[]{
        let i = 0;
        return [
            new Quest(++i, "Gather 10 wood", 10), //id: 0
            new Quest(++i, "Gather 5 stone", 5),  //id: 1
            new Quest(++i, "Build an inclosed space", 1),
            new Quest(++i, "Build a furnace", 1),
            new Quest(++i, "Smelt 10 glass", 10),
            new Quest(++i, "Gather 12 iron ore", 12),
            new Quest(++i, "Smelt 4 iron", 4),
        ];
    }
}
class QuestManager{
    public static instance:QuestManager;
    public constructor(){
        this.UpdateDisplayQuest();
    }
    activeQuestId: number = 0;
    quests: Quest[] = Quest.GetQuests();
    public GetActiveQuest(): Quest{
        return this.quests[this.activeQuestId];
    }
    public async UpdateQuestProgress(progress?:number): Promise<void>{
        if(progress == undefined) progress = 1;

        const currentQuest = this.GetActiveQuest();

        currentQuest.questRequirementStep+=progress;
        document.getElementById("Quest-Completion")!.innerText = currentQuest.questRequirementStep + "/" + currentQuest.questRequirementStepsMax;

        if(currentQuest.questRequirementStep >= currentQuest.questRequirementStepsMax){
            await new Promise(r => setTimeout(r, 1000));
            this.activeQuestId++;
            if(this.activeQuestId - 1 >= Quest.length) this.activeQuestId = 1000;
            this.UpdateDisplayQuest();
        }
    }
    public UpdateDisplayQuest(): void{
        if(this.activeQuestId < 1000){
            const currentQuest = this.GetActiveQuest();
            document.getElementById("Quest-ID")!.innerText = currentQuest.questID.toString() + ")";
            document.getElementById("Quest-Description")!.innerText = currentQuest.questRequirement;
            document.getElementById("Quest-Completion")!.innerText = currentQuest.questRequirementStep + "/" + currentQuest.questRequirementStepsMax;
        }
        else{
            document.getElementById("Quest-ID")!.innerText = "";
            document.getElementById("Quest-Description")!.innerText = "All quests completed!";
            document.getElementById("Quest-Completion")!.innerText = "";
        }
    }
}