abstract class Quest{
    public constructor(questID:number, questRequirement: string, numberOfSteps: number){
        this.questXP = questID;
        this.questRequirement = questRequirement;
        this.questRequirementStepsMax = numberOfSteps;
    }
    questXP:number;
    questRequirement: string;
    questRequirementStep: number = 0;
    questRequirementStepsMax: number;

    public static GetQuests(): Quest[]{
        return [
            new ResourceQuest(2, "Gather 10 wood", 10, ResourceTypes.wood),
            new ResourceQuest(2, "Gather 5 stone", 5, ResourceTypes.stone),
            new SpecialTriggerQuest(5, "Build an inclosed space", 1, 0),
            new SpecialTriggerQuest(4, "Build a furnace", 1, 1),
            new ResourceQuest(4, "Smelt 10 glass", 10, ResourceTypes.glass),
            new ResourceQuest(4, "Gather 12 iron ore", 12, ResourceTypes.iron_ore),
            new ResourceQuest(5, "Smelt 4 iron", 4, ResourceTypes.iron),
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
class RandomResourceQuest extends ResourceQuest{
    public constructor(QuestID: number){
        //picks a random resource type
        const enumValues = Object.values(ResourceTypes).filter(value => typeof value === "number");
        const PickedResourceIndex: number = Math.floor(Math.random() * enumValues.length);
        const resourceType: ResourceTypes = enumValues[PickedResourceIndex];

        const numberOfSteps = Math.floor(Math.random() * 30 + (enumValues.length - PickedResourceIndex));

        const questRequirement = `Gather ${numberOfSteps} ${ResourceTypes[resourceType].replace("_", " ")}`;

        super(QuestManager.GetXPRewardFromRandomQuest(QuestID, numberOfSteps, (0.7 + (PickedResourceIndex/enumValues.length))), questRequirement, numberOfSteps, resourceType);
    }
}
class SpecialTriggerQuest extends Quest{
    TriggerID: number;
    public constructor(questID:number, questRequirement: string, numberOfSteps: number, TriggerID: number){
        super(questID, questRequirement, numberOfSteps);
        this.TriggerID = TriggerID;
    }
}
class QuestManager{
    public static ins:QuestManager;
    public static PlayerXP: number = 0;
    public static PlayerXpToNextLevel: number = 0;
    public static PlayerLevel: number = 1;

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
            await new Promise(r => setTimeout(r, 500));
            //quest completed
            QuestManager.PlayerXP += currentQuest.questXP;
            this.activeQuestId++;

            if(this.activeQuestId >= this.quests.length) this.quests.push(new RandomResourceQuest(this.activeQuestId+1));
            this.UpdateDisplayQuest();

            while(QuestManager.PlayerXP >= QuestManager.PlayerXpToNextLevel){
                this.UpdateLevelDisplay();
                await new Promise(r => setTimeout(r, 500));
                QuestManager.PlayerXP -= QuestManager.PlayerXpToNextLevel;
                QuestManager.PlayerXpToNextLevel = Math.floor(Math.log(QuestManager.PlayerLevel+3)*10); //TODO:
                QuestManager.PlayerLevel++;
            }

            this.UpdateLevelDisplay();
        }
    }
    public UpdateDisplayQuest(): void{
        const currentQuest = this.GetActiveQuest();

        if(currentQuest != null){
            document.getElementById("Quest-XP")!.innerText = currentQuest.questXP.toString() + "xp";
            document.getElementById("Quest-Description")!.innerText = currentQuest.questRequirement;
            document.getElementById("Quest-Completion")!.innerText = currentQuest.questRequirementStep + "/" + currentQuest.questRequirementStepsMax;
        }
        else{
            document.getElementById("Quest-XP")!.innerText = "";
            document.getElementById("Quest-Description")!.innerText = "No active quests";
            document.getElementById("Quest-Completion")!.innerText = "";
        }
    }
    public UpdateLevelDisplay(): void{
        document.getElementById("Player-Level")!.innerText = "Level: " + QuestManager.PlayerLevel;
        document.getElementById("Player-XPLevel")!.innerText = QuestManager.PlayerXP + "/" + QuestManager.PlayerXpToNextLevel;
    }
    public static GetXPRewardFromRandomQuest(id: number, ResourceCount: number, XpMultiplier: number): number{
        return Math.floor( Math.floor(ResourceCount / 3.5) * XpMultiplier + (id * 0.33) );
    }
}