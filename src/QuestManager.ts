class Quest{ //TODO: maybe XP and maybe rewards and maybe endgame repetetive random quests
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
            new ResourceQuest(++i, "Gather 10 wood", 10, ResourceTypes.wood), //id: 0
            new ResourceQuest(++i, "Gather 5 stone", 5, ResourceTypes.stone),  //id: 1
            new Quest(++i, "Build an inclosed space", 1),
            new Quest(++i, "Build a furnace", 1),
            new ResourceQuest(++i, "Smelt 10 glass", 10, ResourceTypes.glass),
            new ResourceQuest(++i, "Gather 12 iron ore", 12, ResourceTypes.iron_ore),
            new ResourceQuest(++i, "Smelt 4 iron", 4, ResourceTypes.iron),
        ];
    }
}
class ResourceQuest extends Quest{
    public constructor(questID:number, questRequirement: string, numberOfSteps: number, resourceType: ResourceTypes){
        super(questID, questRequirement, numberOfSteps);
        this.resourceType = resourceType;
    }
    resourceType: ResourceTypes;
    public CheckCompleteQuest(ResourceType: ResourceTypes, amount: number): void{
        if(this.resourceType == ResourceType){
            QuestManager.ins.UpdateQuestProgress(amount);
        }
    }
}
class QuestManager{
    public static ins:QuestManager;
    public constructor(){
        this.UpdateDisplayQuest();
    }
    activeQuestId: number = 0;
    quests: Quest[] = Quest.GetQuests();
    public GetActiveQuest(): Quest | null{
        if(this.activeQuestId >= this.quests.length) return null;
        return this.quests[this.activeQuestId];
    }
    public async UpdateQuestProgress(progress?:number): Promise<void>{
        if(progress == undefined) progress = 1;

        const currentQuest = this.GetActiveQuest();

        if(currentQuest == null) return;

        currentQuest.questRequirementStep = Math.min(progress+currentQuest.questRequirementStep, currentQuest.questRequirementStepsMax);
        document.getElementById("Quest-Completion")!.innerText = currentQuest.questRequirementStep + "/" + currentQuest.questRequirementStepsMax;

        if(currentQuest.questRequirementStep >= currentQuest.questRequirementStepsMax){
            await new Promise(r => setTimeout(r, 1000));
            this.activeQuestId++;
            if(this.activeQuestId - 1 >= this.quests.length) this.activeQuestId = 1000;
            this.UpdateDisplayQuest();
        }
    }
    public UpdateDisplayQuest(): void{
        const currentQuest = this.GetActiveQuest();

        if(this.activeQuestId < 1000 && currentQuest != null){
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