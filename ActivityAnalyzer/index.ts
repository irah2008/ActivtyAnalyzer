import { IInputs, IOutputs } from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
import { BorderWidth, Chart, Point, ChartColor } from 'chart.js';
type DataSet = ComponentFramework.PropertyTypes.DataSet;
const plugin = {
	afterDraw: (chartInstance: Chart, easing: Chart.Easing, options?: any) => { },
};

export class ActivityAnalyzer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	private _context: ComponentFramework.Context<IInputs>;
	private _container: HTMLDivElement;
	private _numberOfRecords: number;
	private _viewname: string;
	private _activityList: string[];
	private _activitycolour: string[];
	private _chartname: string;
	private _charttype: string;
	// Flag if control view has been rendered
	private _controlViewRendered: Boolean;
	/**
	 * Empty constructor.
	 */
	constructor() {

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
		debugger;
		// Add control initialization code
		this._context = context;
		this._container = container;
		this._controlViewRendered = false;
		this.GetAllParams();
	}
	private GetAllParams() {
		this._viewname = this._context.parameters.dataSet.getViewId() == undefined ? "" : this._context.parameters.dataSet.getTitle();
		this._activityList = this._context.parameters.activityNameArray == undefined || this._context.parameters.activityNameArray.raw == null  ? [] : this._context.parameters.activityNameArray.raw.split(',');
		this._activitycolour = this._context.parameters.activtyColourArray == undefined || this._context.parameters.activtyColourArray.raw == null  ? [] : this._context.parameters.activtyColourArray.raw.split(',');
		this._chartname = this._context.parameters.chartTitle == undefined || this._context.parameters.chartTitle.raw == null ? "" : this._context.parameters.chartTitle.raw;
		this._charttype = this._context.parameters.chartType == undefined || this._context.parameters.chartType.raw == null ? "" : this._context.parameters.chartType.raw;
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {
		this._context = context;
		this.ProcessAllRecordsInDataSet(this._context);
	}

	private ProcessAllRecordsInDataSet(context: ComponentFramework.Context<IInputs>) {
		//We make sure that the data set loading is finished.
		if (!this._controlViewRendered && !this._context.parameters.dataSet.loading) {
			if (context.parameters.dataSet.paging != null && context.parameters.dataSet.paging.hasNextPage == true) {

				//set page size
				context.parameters.dataSet.paging.setPageSize(5000);
				//load next paging
				context.parameters.dataSet.paging.loadNextPage();
			} else {
				this._controlViewRendered = true;

				//We remove all items to make sure that if you perform a refresh, it will not add the records again.
				this.RemoveChildItems();

				var dataSetValue = new Array();
				this._context.parameters.dataSet.sortedRecordIds.forEach((currentRecordId) => {
					let recordType = this._context.parameters.dataSet.records[currentRecordId].getFormattedValue("activitytypecode");
					let recordId = currentRecordId;
					let ActivtyObject: { type: string, id: string } = { id: recordId, type: recordType };
					dataSetValue.push(ActivtyObject);
				});

				var titleValue = this._activityList.length == 0 || this._activityList.length != this._activitycolour.length ? ["Appointment", "Email", "Fax", "Letter", "Phone Call", "Task"] : this._activityList;
				var dataValue = new Array(titleValue.length);
				let iteration = 0;
				titleValue.forEach((activitytype) => {
					let currentValue = 0;
					dataSetValue.filter(function (item) {
						if (item.type == activitytype) {
							currentValue++;
						}
					});
					dataValue[iteration] = currentValue;
					iteration++;
				});

				this.GetChart(titleValue, dataValue);
				//Start the process for each records in the dataset (subgrid,view...).
			}
		}
	}

	private GetChart(labelValue: Array<string>, dataValue: Array<any>) {

		const chartOptions: Chart.ChartOptions = {

			legend: {
				display: true, labels: {
					fontColor: '#000000'
				}, position: 'top'
			},
			//scale: scaleOptions,
			responsive: true,
			animation: {
				animateScale: true,
				animateRotate: true
			},
			title: {
				display: this._chartname.length > 0 ? true : false,
				text: this._chartname.length > 0 ? this._chartname : ""
			},
		};
		var _canvasElement = document.createElement('canvas');
		_canvasElement.id = "myChart";


		this._container.appendChild(_canvasElement);
		const chart: Chart = new Chart(_canvasElement, {
			type: this._charttype,
			data: {
				labels: labelValue,
				datasets: [{ label: 'Activity Count', data: dataValue, backgroundColor: this._activitycolour.length == 0 || this._activitycolour.length != this._activityList.length ? ["#F24F21", "#7FBA00", "#00A4EF", "#FFB900", "#006EC4", "#7719AA"] : this._activitycolour }],
			},
			options: chartOptions
		});
	}

	private RemoveChildItems() {
		while (this._container.firstChild) {
			this._container.removeChild(this._container.firstChild);
		}
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		// Add code to cleanup control if necessary
	}

}