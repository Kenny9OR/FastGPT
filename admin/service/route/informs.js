import {Informs, User} from '../schema.js';
import dayjs from 'dayjs';
import { auth } from './system.js';

export const useInformsRoute = (app) => {

    // 获取通知
    app.get('/informs', auth(), async (req, res) => {
        try {
            const start = parseInt(req.query._start) || 0;
            const end = parseInt(req.query._end) || 20;
            const order = req.query._order === 'DESC' ? -1 : 1;
            const sort = req.query._sort || 'time';
            const title = req.query.title || '';
            const where = {
                title: { $regex: title, $options: 'i' }
            };

            const informsRaw = await Informs.find(where)
                .skip(start)
                .limit(end - start)
                .sort({ [sort]: order });

            const informs = informsRaw.map((inform) => {
                const obj = inform.toObject();
                return {
                    ...obj,
                    userId: obj.userId,
                    time: dayjs(obj.time).format('YYYY/MM/DD HH:mm'),
                    type: obj.type,
                    title: obj.title,
                    content: obj.content,
                    read: obj.read
                }
            });

            const totalCount = await Informs.countDocuments(where);

            res.header('Access-Control-Expose-Headers', 'X-Total-Count');
            res.header('X-Total-Count', totalCount);
            res.json(informs);
        } catch (err) {
            console.log(`Error fetching informs: ${err}`);
            res.status(500).json({ error: 'Error fetching informs' });
        }
    });

    // 创建通知
    app.post('/informs', auth(), async (req, res) => {
        try {
            const { userId, title, content } = req.body;
            if (!title || !content) {
                return res.status(400).json({ error: '标题或内容不能为空' });
            }
            if (userId) {
                const userIds = userId.toString().split(',');
                const result = Informs.insertMany(
                    userIds.map((id) => ({
                        time: new Date(),
                        type: 'system',
                        title,
                        content,
                        userId: id
                    }))
                )
                res.json(result);
            } else {
                const users = await User.find({}, '_id');
                const result = await Informs.insertMany(
                    users.map(({ _id }) => ({
                        time: new Date(),
                        type: 'system',
                        title,
                        content,
                        userId: _id
                    }))
                );
                res.json(result);
            }
        } catch (err) {
            console.log(`Error fetching informs: ${err}`);
            res.status(500).json({ error: 'Error fetching informs' });
        }
    })

};