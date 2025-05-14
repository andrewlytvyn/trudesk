import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

import {
  fetchDashboardData,
  fetchDashboardTopGroups,
  fetchDashboardTopTags,
  fetchDashboardOverdueTickets
} from 'actions/dashboard'

import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import PageTitle from 'components/PageTitle'
import PageContent from 'components/PageContent'
import TruCard from 'components/TruCard'
import SingleSelect from 'components/SingleSelect'
import CountUp from 'components/CountUp'
import PeityBar from 'components/Peity/peity-bar'
import PeityPie from 'components/Peity/peity-pie'
import PeityLine from 'components/Peity/peity-line'
import MGraph from 'components/MGraph'
import D3Pie from 'components/D3/d3pie'

import moment from 'moment-timezone'
import helpers from 'lib/helpers'

@observer
class DashboardContainer extends React.Component {
  @observable timespan = 30

  constructor (props) {
    super(props)
  }

  componentDidMount () {
    helpers.UI.setupPeity()

    this.props.fetchDashboardData({ timespan: this.timespan })
    this.props.fetchDashboardTopGroups({ timespan: this.timespan })
    this.props.fetchDashboardTopTags({ timespan: this.timespan })
    this.props.fetchDashboardOverdueTickets()
  }

  onTimespanChange = e => {
    e.preventDefault()
    this.timespan = e.target.value
    this.props.fetchDashboardData({ timespan: e.target.value })
    this.props.fetchDashboardTopGroups({ timespan: e.target.value })
    this.props.fetchDashboardTopTags({ timespan: e.target.value })
  }

  render () {
    const formatString = helpers.getLongDateFormat() + ' ' + helpers.getTimeFormat()
    const tz = helpers.getTimezone()
    const lastUpdatedFormatted = this.props.dashboardState.lastUpdated
      ? moment(this.props.dashboardState.lastUpdated, 'MM/DD/YYYY hh:mm:ssa')
          .tz(tz)
          .format(formatString)
      : 'Cache Still Loading...'

    const closedPercent = this.props.dashboardState.closedCount
      ? Math.round((this.props.dashboardState.closedCount / this.props.dashboardState.ticketCount) * 100).toString()
      : '0'

    return (
      <div>
        <PageTitle
          title={'Панель'}
          rightComponent={
            <div>
              <div className={'uk-float-right'} style={{ minWidth: 250 }}>
                <div style={{ marginTop: 8 }}>
                  <SingleSelect
                    items={[
                      { text: 'Останні 30 днів', value: '30' },
                      { text: 'Останні 60 днів', value: '60' },
                      { text: 'Останні 90 днів', value: '90' },
                      { text: 'Останні 180 днів', value: '180' },
                      { text: 'Останні 365 днів', value: '365' }
                    ]}
                    defaultValue={'30'}
                    onSelectChange={e => this.onTimespanChange(e)}
                  />
                </div>
              </div>
              <div className={'uk-float-right uk-text-muted uk-text-small'} style={{ margin: '23px 25px 0 0' }}>
                <strong>Станом на: </strong>
                <span>{lastUpdatedFormatted}</span>
              </div>
            </div>
          }
        />
        <PageContent>
          <Grid>
            <GridItem width={'1-3'}>
              <TruCard
                content={
                  <div>
                    <div className='right uk-margin-top uk-margin-small-right'>
                      <PeityBar values={'5,3,9,6,5,9,7'} />
                    </div>
                    <span className='uk-text-muted uk-text-small'>
                      Всього заявок (last {this.timespan.toString()}d)
                    </span>

                    <h2 className='uk-margin-remove'>
                      <CountUp startNumber={0} endNumber={this.props.dashboardState.ticketCount || 0} />
                    </h2>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-3'}>
              <TruCard
                content={
                  <div>
                    <div className='right uk-margin-top uk-margin-small-right'>
                      <PeityPie type={'donut'} value={(closedPercent !== 'NaN' ? closedPercent : '0') + '/100'} />
                    </div>
                    <span className='uk-text-muted uk-text-small'>Заявок виконано</span>

                    <h2 className='uk-margin-remove'>
                      <span>{closedPercent !== 'NaN' ? closedPercent : '0'}</span>%
                    </h2>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-3'}>
              <TruCard
                content={
                  <div>
                    <div className='right uk-margin-top uk-margin-small-right'>
                      <PeityLine values={'5,3,9,6,5,9,7,3,5,2'} />
                    </div>
                    <span className='uk-text-muted uk-text-small'>Середній час реагування</span>

                    <h2 className='uk-margin-remove'>
                      <CountUp endNumber={this.props.dashboardState.ticketAvg || 0} extraText={'hours'} />
                    </h2>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-1'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Розподіл заявок</h6>
                  </div>
                }
                fullSize={true}
                hover={false}
                extraContentClass={'nopadding'}
                content={
                  <div className='mGraph mGraph-panel' style={{ minHeight: 200, position: 'relative' }}>
                    <MGraph
                      height={250}
                      x_accessor={'date'}
                      y_accessor={'value'}
                      data={this.props.dashboardState.ticketBreakdownData.toJS() || []}
                    />
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                loaderActive={this.props.dashboardState.loadingTopGroups}
                animateLoader={true}
                style={{ minHeight: 256 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Top 5 Groups</h6>
                  </div>
                }
                content={
                  <div>
                    <D3Pie data={this.props.dashboardState.topGroups.toJS()} />
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                loaderActive={this.props.dashboardState.loadingTopTags}
                animateLoader={true}
                animateDelay={800}
                style={{ minHeight: 256 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Топ 10 Теґів</h6>
                  </div>
                }
                content={
                  <div>
                    <D3Pie type={'donut'} data={this.props.dashboardState.topTags.toJS()} />
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                style={{ minHeight: 250 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Прострочені заявки</h6>
                  </div>
                }
                content={
                  <div className='uk-overflow-container'>
                    <table className='uk-table'>
                      <thead>
                        <tr>
                          <th className='uk-text-nowrap'>Заявка</th>
                          <th className='uk-text-nowrap'>Статус</th>
                          <th className='uk-text-nowrap'>Тема</th>
                          <th className='uk-text-nowrap uk-text-right'>остання зміна</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.dashboardState.overdueTickets.map(ticket => {
                          return (
                            <tr key={ticket.get('_id')} className={'uk-table-middle'}>
                              <td className={'uk-width-1-10 uk-text-nowrap'}>
                                <a href={`/tickets/${ticket.get('uid')}`}>T#{ticket.get('uid')}</a>
                              </td>
                              <td className={'uk-width-1-10 uk-text-nowrap'}>
                                <span className={'uk-badge ticket-status-open uk-width-1-1 ml-0'}>Відкрити</span>
                              </td>
                              <td className={'uk-width-6-10'}>{ticket.get('subject')}</td>
                              <td className={'uk-width-2-10 uk-text-right uk-text-muted uk-text-small'}>
                                {moment
                                  .utc(ticket.get('updated'))
                                  .tz(helpers.getTimezone())
                                  .format(helpers.getShortDateFormat())}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Швидка стата (Last 365 Days)</h6>
                  </div>
                }
                content={
                  <div className='uk-overflow-container'>
                    <table className='uk-table'>
                      <thead>
                        <tr>
                          <th className='uk-text-nowrap'>Найменування</th>
                          <th className='uk-text-nowrap uk-text-right'>Значення</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className='uk-table-middle'>
                          <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                            Найбільше заявок від...
                          </td>
                          <td id='mostRequester' className='uk-width-4-10 uk-text-right  uk-text-small'>
                            {this.props.dashboardState.mostRequester
                              ? `${this.props.dashboardState.mostRequester.get(
                                  'name'
                                )} (${this.props.dashboardState.mostRequester.get('value')})`
                              : '--'}
                          </td>
                        </tr>

                        <tr className='uk-table-middle'>
                          <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                            Найбільше коментарів від...
                          </td>
                          <td id='mostCommenter' className='uk-width-4-10 uk-text-right  uk-text-small'>
                            {this.props.dashboardState.mostCommenter
                              ? `${this.props.dashboardState.mostCommenter.get(
                                  'name'
                                )} (${this.props.dashboardState.mostCommenter.get('value')})`
                              : '--'}
                          </td>
                        </tr>

                        <tr className='uk-table-middle'>
                          <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                            Найбільше призначень...
                          </td>
                          <td id='mostAssignee' className='uk-width-4-10 uk-text-right  uk-text-small'>
                            {this.props.dashboardState.mostAssignee
                              ? `${this.props.dashboardState.mostAssignee.get(
                                  'name'
                                )} (${this.props.dashboardState.mostAssignee.get('value')})`
                              : '--'}
                          </td>
                        </tr>

                        <tr className='uk-table-middle'>
                          <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                            Найактивніша заявка...
                          </td>
                          <td className='uk-width-4-10 uk-text-right  uk-text-small'>
                            <a id='mostActiveTicket' href='#'>
                              {this.props.dashboardState.mostActiveTicket
                                ? `T#${this.props.dashboardState.mostActiveTicket.get('uid')}`
                                : '--'}
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                }
              />
            </GridItem>
          </Grid>
        </PageContent>
      </div>
    )
  }
}

DashboardContainer.propTypes = {
  fetchDashboardData: PropTypes.func.isRequired,
  fetchDashboardTopGroups: PropTypes.func.isRequired,
  fetchDashboardTopTags: PropTypes.func.isRequired,
  fetchDashboardOverdueTickets: PropTypes.func.isRequired,
  dashboardState: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  dashboardState: state.dashboardState
})

export default connect(mapStateToProps, {
  fetchDashboardData,
  fetchDashboardTopGroups,
  fetchDashboardTopTags,
  fetchDashboardOverdueTickets
})(DashboardContainer)
